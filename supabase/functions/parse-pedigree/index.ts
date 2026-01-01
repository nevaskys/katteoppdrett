import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PedigreeData {
  name?: string;
  breed?: string;
  color?: string;
  emsCode?: string;
  birthDate?: string;
  registration?: string;
  chipNumber?: string;
  gender?: 'male' | 'female';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, imageUrl } = await req.json();
    
    if (!imageData && !imageUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bilde eller URL er påkrevd' }),
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

    let imageContent: { type: string; image_url?: { url: string }; text?: string }[];

    if (imageData) {
      // Image is base64 data URL
      imageContent = [
        {
          type: "image_url",
          image_url: { url: imageData }
        },
        {
          type: "text",
          text: `Analyser dette stamtavle-bildet for en katt. Ekstraher følgende informasjon om katten (IKKE foreldrene):
          
- Navn på katten
- Rase (breed)
- EMS-kode (f.eks. NFO n 09 24, SBI a 21 33, MCO ns 22 osv.)
- Farge/mønster beskrivelse
- Fødselsdato (i format YYYY-MM-DD)
- Registreringsnummer
- Chip-nummer (hvis synlig)
- Kjønn (male/female)

Returner BARE en JSON-objekt med disse feltene (bruk null for felt som ikke finnes):
{
  "name": "kattens navn",
  "breed": "rase",
  "emsCode": "EMS-kode (f.eks. NFO n 09 24)",
  "color": "farge beskrivelse",
  "birthDate": "YYYY-MM-DD",
  "registration": "registreringsnummer",
  "chipNumber": "chip-nummer eller null",
  "gender": "male eller female"
}

VIKTIG: 
- EMS-kode er standard FIFe-fargekode og skal ekstraheres separat fra fargebeskrivelsen
- Returner KUN JSON, ingen annen tekst.`
        }
      ];
    } else {
      // Fetch image from URL first
      console.log('Fetching image from URL:', imageUrl);
      try {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Kunne ikke hente bilde: ${imageResponse.status}`);
        }
        const imageBlob = await imageResponse.blob();
        const arrayBuffer = await imageBlob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        const mimeType = imageResponse.headers.get('content-type') || 'image/png';
        const dataUrl = `data:${mimeType};base64,${base64}`;
        
        imageContent = [
          {
            type: "image_url",
            image_url: { url: dataUrl }
          },
          {
            type: "text",
            text: `Analyser dette stamtavle-bildet for en katt. Ekstraher følgende informasjon om katten (IKKE foreldrene):
            
- Navn på katten
- Rase (breed)
- EMS-kode (f.eks. NFO n 09 24, SBI a 21 33, MCO ns 22 osv.)
- Farge/mønster beskrivelse
- Fødselsdato (i format YYYY-MM-DD)
- Registreringsnummer
- Chip-nummer (hvis synlig)
- Kjønn (male/female)

Returner BARE en JSON-objekt med disse feltene (bruk null for felt som ikke finnes):
{
  "name": "kattens navn",
  "breed": "rase",
  "emsCode": "EMS-kode (f.eks. NFO n 09 24)",
  "color": "farge beskrivelse",
  "birthDate": "YYYY-MM-DD",
  "registration": "registreringsnummer",
  "chipNumber": "chip-nummer eller null",
  "gender": "male eller female"
}

VIKTIG: 
- EMS-kode er standard FIFe-fargekode og skal ekstraheres separat fra fargebeskrivelsen
- Returner KUN JSON, ingen annen tekst.`
          }
        ];
      } catch (urlError) {
        console.error('Error fetching image from URL:', urlError);
        return new Response(
          JSON.stringify({ success: false, error: 'Kunne ikke hente bilde fra URL' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Sending request to Lovable AI...');

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
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
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
    let pedigreeData: PedigreeData;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        pedigreeData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Ingen JSON funnet i respons');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError, 'Content:', content);
      return new Response(
        JSON.stringify({ success: false, error: 'Kunne ikke tolke stamtavle-data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsed pedigree data:', pedigreeData);

    return new Response(
      JSON.stringify({ success: true, data: pedigreeData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-pedigree function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ukjent feil';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
