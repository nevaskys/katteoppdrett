import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Kun håndskrevne kommentarer fra dommerseddelen
interface JudgingSheetData {
  ocrText?: string;
  structuredResult?: {
    type?: string;        // Type/Typ
    head?: string;        // Hode/Head
    eyes?: string;        // Øyne/Eyes
    ears?: string;        // Ører/Ears
    coat?: string;        // Pels/Coat
    tail?: string;        // Hale/Tail
    condition?: string;   // Kondisjon/Condition
    general?: string;     // Totalinntrykk/General Impression
    result?: string;      // Resultat/Judgement
    judgeName?: string;   // Dommer/Judge
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    const { imageData } = await req.json();
    
    if (!imageData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bilde er påkrevd' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI-tjeneste ikke konfigurert' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const judgingSheetPrompt = `Du er en ekspert på å lese dommersedler fra katteutstillinger. 

Dette bildet viser en DOMMERSEDDEL med håndskrevne kommentarer fra en dommer.

VIKTIG: Du skal KUN ekstrahere de HÅNDSKREVNE kommentarene fra dommeren. IGNORER all trykt header-informasjon (utstillingsnavn, EMS-kode, klasse, kjønn, fødselsdato osv.) - dette hentes fra diplomet.

Dommerseddelen har disse feltene med HÅNDSKREVNE kommentarer til høyre for hver overskrift:

1. "Type/Typ" - Kommentar om kattens type
2. "Hode/Head/Kopf/Tête" - Kommentar om hodet
3. "Øyne/Eyes/Augen/Yeux" - Kommentar om øynene  
4. "Ører/Ears/Ohren/Oreilles" - Kommentar om ørene
5. "Pels/Coat/Fell/Fourrure" - Kommentar om pelsen
6. "Hale/Tail/Schwanz/Queue" - Kommentar om halen
7. "Kondisjon/Condition" - Kommentar om kondisjonen
8. "Totalinntrykk/General Impression/Gesamteindruck" - Generell kommentar
9. "Resultat/Judgement/Bewertung" - Resultat (f.eks. "Ex 3", "EX1 CACS")
10. "Dommer/Judge/Richter/Juge" - Dommerens trykte navn (IKKE signaturen, men det trykte navnet under)

EKSEMPEL fra et bilde:
- Ved "Type/Typ" står det håndskrevet: "Well developed nice lady. Ex body + prop."
- Ved "Hode/Head" står det: "Nice - Well developed. Good chin. Still develop. pattern"
- Ved "Øyne/Eyes" står det: "Ex colors. Some deep set."
- Ved "Dommer/Judge" står det trykt: "Edvardsen Geir Johan"

Returner KUN dette JSON-objektet (ingen annen tekst):
{
  "structuredResult": {
    "type": "håndskrevet kommentar ved Type/Typ",
    "head": "håndskrevet kommentar ved Hode/Head",
    "eyes": "håndskrevet kommentar ved Øyne/Eyes",
    "ears": "håndskrevet kommentar ved Ører/Ears",
    "coat": "håndskrevet kommentar ved Pels/Coat",
    "tail": "håndskrevet kommentar ved Hale/Tail",
    "condition": "håndskrevet kommentar ved Kondisjon",
    "general": "håndskrevet kommentar ved Totalinntrykk",
    "result": "håndskrevet resultat",
    "judgeName": "dommerens TRYKTE navn (ikke signatur)"
  },
  "ocrText": "all håndskrevet tekst samlet"
}

VIKTIG:
- Les håndskriften så nøyaktig som mulig
- Ignorer ALL trykt tekst i header-området (utstilling, nr, EMS-kode, klasse, kjønn, fødselsdato)
- Fokuser KUN på de håndskrevne kommentarene i høyre kolonne
- For "judgeName" - les det TRYKTE navnet under signaturen, ikke signaturen selv
- Bruk null for felt som ikke kan leses
- Returner KUN JSON, ingen annen tekst`;

    const imageContent = [
      {
        type: "image_url",
        image_url: { url: imageData }
      },
      {
        type: "text",
        text: judgingSheetPrompt
      }
    ];

    console.log('Sending judging sheet to Lovable AI for analysis...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: imageContent
          }
        ],
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'For mange forespørsler, prøv igjen senere' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'Kredittgrense nådd' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: `AI-feil: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('AI response received');

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(
        JSON.stringify({ success: false, error: 'Ingen respons fra AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON from the response
    let judgingData: JudgingSheetData;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        judgingData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Ingen JSON funnet i respons');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError, 'Content:', content);
      // Return the raw text as ocrText if parsing fails
      judgingData = {
        ocrText: content
      };
    }

    console.log('Parsed judging sheet data:', JSON.stringify(judgingData, null, 2));

    return new Response(
      JSON.stringify({ success: true, data: judgingData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-judging-sheet function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ukjent feil';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
