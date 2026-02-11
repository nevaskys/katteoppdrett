/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ParsedResult {
  showName: string;
  date: string;
  emsCode?: string;
  class?: string;
  result?: string;
  points?: number;
  judgeName?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Autentisering påkrevd' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, error: 'Ugyldig autentisering' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { imageData, imageUrl } = await req.json();

    if (!imageData && !imageUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Mangler bilde' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'API-nøkkel ikke konfigurert' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Process image
    let base64Image: string;
    let mimeType = 'image/png';

    if (imageData) {
      if (imageData.startsWith('data:')) {
        const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Image = matches[2];
        } else {
          throw new Error('Ugyldig data-URL format');
        }
      } else {
        base64Image = imageData;
      }
    } else if (imageUrl) {
      if (imageUrl.startsWith('data:')) {
        const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Image = matches[2];
        } else {
          throw new Error('Ugyldig data-URL format');
        }
      } else {
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error('Kunne ikke hente bilde fra URL');
        }
        const arrayBuffer = await response.arrayBuffer();
        base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        const contentType = response.headers.get('content-type');
        if (contentType) mimeType = contentType;
      }
    } else {
      throw new Error('Ingen bildedata');
    }

    const prompt = `Analyser dette bildet av en liste over utstillingsresultater for katt.

Ekstraher ALLE rader fra tabellen og returner dem som en JSON-array.

Hver rad inneholder typisk:
- Utstilling (show name with date)
- Dato (date in format DD.MM.YYYY)
- EMS-kode for resultatet (e.g., "NEM as 21")
- Klasse (e.g., "5 (IC)", "7 (CH)", "11 (Ungdyr)", "12 (Kattunger)")
- Resultat (e.g., "EX1 CAGCIB", "EX1 CACIB BIV NOM BIS", "EX1 CAC")
- Poeng (points as a number, e.g., 96.0000, 130.3000)
- Dommer (judge name)

Returner BARE gyldig JSON i dette formatet, ingen annen tekst:
{
  "results": [
    {
      "showName": "VKK søndag 04.06.2023",
      "date": "2023-06-04",
      "emsCode": "NEM as 21",
      "class": "5 (IC)",
      "result": "EX1 CAGCIB",
      "points": 96.0,
      "judgeName": "Pánková Lucie"
    }
  ]
}

VIKTIG:
- Konverter datoer til ISO-format (YYYY-MM-DD)
- Inkluder alle rader, selv om noen felt mangler
- Returner tom array hvis ingen resultater finnes
- Vær nøyaktig med dommernavnene`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64Image}` }
              }
            ]
          }
        ],
        max_tokens: 8000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error('Kunne ikke analysere bildet');
    }

    const aiText = await aiResponse.text();
    console.log('AI response length:', aiText.length);
    
    if (!aiText || aiText.trim() === '') {
      throw new Error('Tom respons fra AI');
    }
    
    let aiData;
    try {
      aiData = JSON.parse(aiText);
    } catch (parseErr) {
      console.error('Failed to parse AI response:', aiText.substring(0, 500));
      throw new Error('Kunne ikke tolke AI-respons');
    }
    
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response:', JSON.stringify(aiData).substring(0, 500));
      throw new Error('Ingen respons fra AI');
    }

    console.log('AI content:', content.substring(0, 200));

    // Parse JSON from response
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      const objectMatch = content.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonStr = objectMatch[0];
      }
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('Failed to parse results JSON:', jsonStr.substring(0, 500));
      throw new Error('Kunne ikke tolke resultatene fra bildet');
    }
    
    const results: ParsedResult[] = parsed.results || [];

    console.log(`Parsed ${results.length} results from image`);

    return new Response(
      JSON.stringify({ success: true, data: { results } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Ukjent feil' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
