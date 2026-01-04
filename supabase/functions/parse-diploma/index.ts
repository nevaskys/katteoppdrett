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

    const diplomaPrompt = `Du er en OCR-ekspert som leser katteutstillingsdiplomer. Analyser dette bildet NØYE.

SE ETTER DISSE FELTENE PÅ DIPLOMET (de står vanligvis på norsk OG engelsk):

1. "Utstilling/Show" - navn og DATO på utstillingen (VIKTIG: datoen er IKKE dagens dato, men når utstillingen var)
2. "List No./Catalogue No." - katalognummer  
3. "Katt/Cat" - kattens navn (kan ha titler foran som GIC, IC, CH)
4. "Rase/Breed" - rase (NEM, NFO, MCO, etc.)
5. "Farge/Colour" - EMS-kode
6. "Kjønn/Sex" - Female/Male
7. "Fødselsdato/Born" - fødselsdato
8. "Eier/Owner" - eierens navn
9. "Klasse/Class" - f.eks. "3 Grand International Champion"
10. "Dommer/Judge" - dommerens FULLE navn (VIKTIG!)
11. "Resultat/Result" - f.eks. "EX1 CACS", "EX3" (VIKTIG!)

EKSEMPEL fra bilde: Hvis du ser "Dommer/Judge: Stark Mats" så er judgeName = "Stark Mats"
EKSEMPEL: Hvis du ser "Resultat/Result: EX1 CACS" så er result = "EX1 CACS"
EKSEMPEL: Hvis du ser "Show: BUR, BURAK, Solberghallen, Solbergelva 24.09.2023" så er showDate = "2023-09-24"

VIKTIG OM DATOER:
- showDate er datoen som står ved "Utstilling/Show" linjen - IKKE dagens dato!
- Konverter norsk datoformat (DD.MM.YYYY) til ISO-format (YYYY-MM-DD)
- Eksempel: "24.09.2023" blir "2023-09-24"

Returner BARE dette JSON-objektet (ingen annen tekst):
{
  "showName": "utstillingens navn uten dato",
  "showLocation": "sted",
  "showDate": "YYYY-MM-DD format fra Utstilling/Show linjen",
  "catalogueNumber": "nummer",
  "catName": "kattens fulle navn med eventuelle titler",
  "breed": "rasekode",
  "color": "farge",
  "emsCode": "EMS-kode",
  "sex": "female eller male",
  "birthDate": "YYYY-MM-DD",
  "owner": "eierens navn",
  "class": "klasse",
  "judgeName": "dommerens fulle navn",
  "result": "komplett resultat inkl sertifikater",
  "certificates": ["array", "av", "sertifikater"],
  "ocrText": "all tekst fra diplomet"
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
