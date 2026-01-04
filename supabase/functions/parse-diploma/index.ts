import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiplomaData {
  showName?: string;
  showLocation?: string;
  showDate?: string;
  catalogueNumber?: string;
  catName?: string;
  breed?: string;
  color?: string;
  emsCode?: string;
  sex?: string;
  birthDate?: string;
  owner?: string;
  class?: string;
  judgeName?: string;
  result?: string;
  certificates?: string[];
  ocrText?: string;
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

    const diplomaPrompt = `Analyser dette bildet av et DIPLOM/forsiden av en dommerseddel fra en katteutstilling (FIFe/NRR/NORAK).

Dette er forsiden av diplomet som viser kattens og utstillingens detaljer. Se etter følgende felt som typisk er organisert i en liste:

TYPISK LAYOUT:
- Utstilling/Show: Navn på utstillingen og sted, ofte med dato
- List No./Catalogue No.: Katalognummer
- Katt/Cat: Kattens fulle navn (ofte med prefiks som GIC, IC, CH, etc.)
- Rase/Breed: Rase (f.eks. NEM, NFO, MCO, RAG, BRI, etc.)
- Farge/Colour: EMS-kode (f.eks. "NEM a 21", "NFO n 09 22")
- Kjønn/Sex: Female/Male/Hunn/Hann
- Fødselsdato/Born: Fødselsdato
- Eier/Owner: Eierens navn
- Klasse/Class: Klasse (f.eks. "3 Grand International Champion", "4 Champion", "11 Kitten")
- Dommer/Judge: Dommerens navn
- Resultat/Result: Resultat (f.eks. "EX1 CACS", "EX2", "EX1 CAC NOM", "BIS")

Returner et JSON-objekt med denne strukturen:
{
  "showName": "utstillingens navn (uten dato)",
  "showLocation": "sted/lokasjon",
  "showDate": "dato i YYYY-MM-DD format",
  "catalogueNumber": "katalognummer",
  "catName": "kattens fulle navn inkludert titler og oppdretternavn",
  "breed": "rasekode (f.eks. NEM, NFO)",
  "color": "full fargebeskrivelse",
  "emsCode": "EMS-kode (f.eks. NEM a 21)",
  "sex": "female eller male",
  "birthDate": "fødselsdato i YYYY-MM-DD format",
  "owner": "eierens navn",
  "class": "klasse (f.eks. Grand International Champion, Champion, Open)",
  "judgeName": "dommerens navn",
  "result": "resultat (f.eks. EX1 CACS, EX1 CAC NOM BIS)",
  "certificates": ["liste", "av", "sertifikater", "som CAC, CACIB, CACS, CAGCIB"],
  "ocrText": "all synlig tekst fra diplomet"
}

VIKTIG:
- Dato skal være i YYYY-MM-DD format
- Kjønn skal normaliseres til "female" eller "male"
- For result, inkluder alle deler (f.eks. "EX1 CACS" ikke bare "EX1")
- certificates skal være en array med individuelle sertifikater
- Returner KUN JSON, ingen annen tekst`;

    const imageContent = [
      {
        type: "image_url",
        image_url: { url: imageData }
      },
      {
        type: "text",
        text: diplomaPrompt
      }
    ];

    console.log('Sending diploma to Lovable AI for analysis...');

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
        max_tokens: 2000,
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
    let diplomaData: DiplomaData;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        diplomaData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Ingen JSON funnet i respons');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError, 'Content:', content);
      // Return the raw text as ocrText if parsing fails
      diplomaData = {
        ocrText: content
      };
    }

    console.log('Parsed diploma data:', JSON.stringify(diplomaData, null, 2));

    return new Response(
      JSON.stringify({ success: true, data: diplomaData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-diploma function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ukjent feil';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
