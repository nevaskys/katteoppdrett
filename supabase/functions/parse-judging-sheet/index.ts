import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JudgingSheetData {
  catName?: string;
  judgeName?: string;
  showName?: string;
  date?: string;
  ocrText?: string;
  structuredResult?: {
    points?: number;
    title?: string;
    placement?: string;
    category?: string;
    class?: string;
    certificates?: string[];
    comments?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const judgingSheetPrompt = `Analyser dette bildet av en dommerseddel fra en katteutstilling.

Ekstraher all tekst og informasjon du kan finne. Dette er typisk et håndskrevet skjema fra en dommer som vurderer en katt.

Prøv å finne:
1. Kattens navn (ofte øverst på skjemaet)
2. Dommerens navn (signatur eller trykt navn)
3. Utstillingens navn/sted
4. Dato
5. Poeng eller vurdering
6. Tittel/klasse (f.eks. "Champion", "Open", etc.)
7. Sertifikater tildelt (CAC, CACIB, etc.)
8. Plassering (1., 2., BIV, BIS, etc.)
9. Dommerens kommentarer og vurdering

Returner et JSON-objekt med denne strukturen:
{
  "catName": "kattens navn hvis funnet",
  "judgeName": "dommerens navn hvis funnet", 
  "showName": "utstillingens navn/sted hvis funnet",
  "date": "dato i YYYY-MM-DD format hvis funnet",
  "ocrText": "ALL tekst fra dommerseddelen, inkludert håndskrift, formatert leselig med linjeskift",
  "structuredResult": {
    "points": tall eller null,
    "title": "tittel/klasse hvis funnet",
    "placement": "plassering hvis funnet",
    "category": "kategori hvis funnet",
    "class": "klasse hvis funnet",
    "certificates": ["liste", "av", "sertifikater"],
    "comments": "dommerens kommentarer"
  }
}

VIKTIG:
- Gjør ditt beste for å lese håndskrift
- Inkluder ALL lesbar tekst i ocrText-feltet
- Bruk null for felt som ikke kan identifiseres
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
        max_tokens: 3000,
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

    console.log('Parsed judging sheet data:', judgingData);

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
