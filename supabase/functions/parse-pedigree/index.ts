import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Ancestor {
  name: string;
  registration?: string;
}

interface PedigreeData {
  name?: string;
  breed?: string;
  color?: string;
  emsCode?: string;
  birthDate?: string;
  registration?: string;
  chipNumber?: string;
  gender?: 'male' | 'female';
  // Full pedigree tree - Generation 1
  sire?: Ancestor;
  dam?: Ancestor;
  // Generation 2
  sire_sire?: Ancestor;
  sire_dam?: Ancestor;
  dam_sire?: Ancestor;
  dam_dam?: Ancestor;
  // Generation 3
  sire_sire_sire?: Ancestor;
  sire_sire_dam?: Ancestor;
  sire_dam_sire?: Ancestor;
  sire_dam_dam?: Ancestor;
  dam_sire_sire?: Ancestor;
  dam_sire_dam?: Ancestor;
  dam_dam_sire?: Ancestor;
  dam_dam_dam?: Ancestor;
  // Generation 4
  sire_sire_sire_sire?: Ancestor;
  sire_sire_sire_dam?: Ancestor;
  sire_sire_dam_sire?: Ancestor;
  sire_sire_dam_dam?: Ancestor;
  sire_dam_sire_sire?: Ancestor;
  sire_dam_sire_dam?: Ancestor;
  sire_dam_dam_sire?: Ancestor;
  sire_dam_dam_dam?: Ancestor;
  dam_sire_sire_sire?: Ancestor;
  dam_sire_sire_dam?: Ancestor;
  dam_sire_dam_sire?: Ancestor;
  dam_sire_dam_dam?: Ancestor;
  dam_dam_sire_sire?: Ancestor;
  dam_dam_sire_dam?: Ancestor;
  dam_dam_dam_sire?: Ancestor;
  dam_dam_dam_dam?: Ancestor;
  // Generation 5
  sire_sire_sire_sire_sire?: Ancestor;
  sire_sire_sire_sire_dam?: Ancestor;
  sire_sire_sire_dam_sire?: Ancestor;
  sire_sire_sire_dam_dam?: Ancestor;
  sire_sire_dam_sire_sire?: Ancestor;
  sire_sire_dam_sire_dam?: Ancestor;
  sire_sire_dam_dam_sire?: Ancestor;
  sire_sire_dam_dam_dam?: Ancestor;
  sire_dam_sire_sire_sire?: Ancestor;
  sire_dam_sire_sire_dam?: Ancestor;
  sire_dam_sire_dam_sire?: Ancestor;
  sire_dam_sire_dam_dam?: Ancestor;
  sire_dam_dam_sire_sire?: Ancestor;
  sire_dam_dam_sire_dam?: Ancestor;
  sire_dam_dam_dam_sire?: Ancestor;
  sire_dam_dam_dam_dam?: Ancestor;
  dam_sire_sire_sire_sire?: Ancestor;
  dam_sire_sire_sire_dam?: Ancestor;
  dam_sire_sire_dam_sire?: Ancestor;
  dam_sire_sire_dam_dam?: Ancestor;
  dam_sire_dam_sire_sire?: Ancestor;
  dam_sire_dam_sire_dam?: Ancestor;
  dam_sire_dam_dam_sire?: Ancestor;
  dam_sire_dam_dam_dam?: Ancestor;
  dam_dam_sire_sire_sire?: Ancestor;
  dam_dam_sire_sire_dam?: Ancestor;
  dam_dam_sire_dam_sire?: Ancestor;
  dam_dam_sire_dam_dam?: Ancestor;
  dam_dam_dam_sire_sire?: Ancestor;
  dam_dam_dam_sire_dam?: Ancestor;
  dam_dam_dam_dam_sire?: Ancestor;
  dam_dam_dam_dam_dam?: Ancestor;
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

    const pedigreePrompt = `Analyser dette stamtavle-bildet for en katt. Ekstraher HELE stamtavlen med alle forfedre opp til 5 generasjoner.

VIKTIG: En stamtavle har et hierarkisk format der:
- Hovedkatten er subjektet
- Far (Sire) er på høyre side øverst
- Mor (Dam) er på høyre side nederst
- Besteforeldre og oldeforeldre er videre til høyre

Ekstraher følgende informasjon:

1. HOVEDKATTEN:
- name: Kattens navn
- breed: Rase
- emsCode: EMS-kode (f.eks. NFO n 09 24)
- color: Farge beskrivelse
- birthDate: Fødselsdato (YYYY-MM-DD)
- registration: Registreringsnummer
- chipNumber: Chip-nummer
- gender: male/female

2. FORELDRE (generasjon 1):
- sire: Far (name, registration)
- dam: Mor (name, registration)

3. BESTEFORELDRE (generasjon 2):
- sire_sire: Farfar (name, registration)
- sire_dam: Farmor (name, registration)
- dam_sire: Morfar (name, registration)
- dam_dam: Mormor (name, registration)

4. OLDEFORELDRE (generasjon 3):
- sire_sire_sire: Farfars far
- sire_sire_dam: Farfars mor
- sire_dam_sire: Farmors far
- sire_dam_dam: Farmors mor
- dam_sire_sire: Morfars far
- dam_sire_dam: Morfars mor
- dam_dam_sire: Mormors far
- dam_dam_dam: Mormors mor

5. TIPP-OLDEFORELDRE (generasjon 4):
- sire_sire_sire_sire, sire_sire_sire_dam: Farfars fars foreldre
- sire_sire_dam_sire, sire_sire_dam_dam: Farfars mors foreldre
- sire_dam_sire_sire, sire_dam_sire_dam: Farmors fars foreldre
- sire_dam_dam_sire, sire_dam_dam_dam: Farmors mors foreldre
- dam_sire_sire_sire, dam_sire_sire_dam: Morfars fars foreldre
- dam_sire_dam_sire, dam_sire_dam_dam: Morfars mors foreldre
- dam_dam_sire_sire, dam_dam_sire_dam: Mormors fars foreldre
- dam_dam_dam_sire, dam_dam_dam_dam: Mormors mors foreldre

6. GENERASJON 5 (tipp-tipp-oldeforeldre):
- sire_sire_sire_sire_sire, sire_sire_sire_sire_dam
- sire_sire_sire_dam_sire, sire_sire_sire_dam_dam
- sire_sire_dam_sire_sire, sire_sire_dam_sire_dam
- sire_sire_dam_dam_sire, sire_sire_dam_dam_dam
- sire_dam_sire_sire_sire, sire_dam_sire_sire_dam
- sire_dam_sire_dam_sire, sire_dam_sire_dam_dam
- sire_dam_dam_sire_sire, sire_dam_dam_sire_dam
- sire_dam_dam_dam_sire, sire_dam_dam_dam_dam
- dam_sire_sire_sire_sire, dam_sire_sire_sire_dam
- dam_sire_sire_dam_sire, dam_sire_sire_dam_dam
- dam_sire_dam_sire_sire, dam_sire_dam_sire_dam
- dam_sire_dam_dam_sire, dam_sire_dam_dam_dam
- dam_dam_sire_sire_sire, dam_dam_sire_sire_dam
- dam_dam_sire_dam_sire, dam_dam_sire_dam_dam
- dam_dam_dam_sire_sire, dam_dam_dam_sire_dam
- dam_dam_dam_dam_sire, dam_dam_dam_dam_dam

Returner et JSON-objekt med denne strukturen:
{
  "name": "kattens navn",
  "breed": "rase",
  "emsCode": "EMS-kode",
  "color": "farge",
  "birthDate": "YYYY-MM-DD",
  "registration": "reg.nr",
  "chipNumber": "chip eller null",
  "gender": "male eller female",
  "sire": {"name": "navn", "registration": "reg.nr"},
  "dam": {"name": "navn", "registration": "reg.nr"},
  "sire_sire": {"name": "...", "registration": "..."},
  "sire_dam": {"name": "...", "registration": "..."},
  "dam_sire": {"name": "...", "registration": "..."},
  "dam_dam": {"name": "...", "registration": "..."},
  "sire_sire_sire": {"name": "...", "registration": "..."},
  ... (alle generasjon 3 forfedre)
  "sire_sire_sire_sire": {"name": "...", "registration": "..."},
  ... (alle generasjon 4 forfedre)
  "sire_sire_sire_sire_sire": {"name": "...", "registration": "..."},
  ... (alle generasjon 5 forfedre)
}

VIKTIG: 
- Bruk null for felt/forfedre som ikke finnes i bildet
- Returner KUN JSON, ingen annen tekst
- Prøv å lese alle navn så nøyaktig som mulig
- Les alle 5 generasjoner hvis de er synlige i bildet`;

    let imageContent: { type: string; image_url?: { url: string }; text?: string }[];

    // Check if imageUrl is actually a data URL (base64)
    const isDataUrl = imageUrl && imageUrl.startsWith('data:');
    
    if (imageData || isDataUrl) {
      // Image is already base64 data URL
      const dataUrl = imageData || imageUrl;
      console.log('Using base64 data URL for image');
      imageContent = [
        {
          type: "image_url",
          image_url: { url: dataUrl }
        },
        {
          type: "text",
          text: pedigreePrompt
        }
      ];
    } else if (imageUrl) {
      // Fetch image from external URL
      console.log('Fetching image from URL:', imageUrl);
      try {
        const imageResponse = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        if (!imageResponse.ok) {
          console.error('Failed to fetch image:', imageResponse.status, imageResponse.statusText);
          throw new Error(`Kunne ikke hente bilde: ${imageResponse.status}`);
        }
        const imageBlob = await imageResponse.blob();
        const arrayBuffer = await imageBlob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        const mimeType = imageResponse.headers.get('content-type') || 'image/png';
        const dataUrl = `data:${mimeType};base64,${base64}`;
        
        console.log('Successfully fetched and converted image to base64');
        imageContent = [
          {
            type: "image_url",
            image_url: { url: dataUrl }
          },
          {
            type: "text",
            text: pedigreePrompt
          }
        ];
      } catch (urlError) {
        console.error('Error fetching image from URL:', urlError);
        return new Response(
          JSON.stringify({ success: false, error: 'Kunne ikke hente bilde fra URL. Sjekk at URLen er tilgjengelig.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Bilde eller URL er påkrevd' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending request to Lovable AI for 5-generation pedigree parsing...');

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

    // Count how many ancestors were extracted
    const gen5Fields = [
      'sire_sire_sire_sire_sire', 'sire_sire_sire_sire_dam',
      'sire_sire_sire_dam_sire', 'sire_sire_sire_dam_dam',
      'sire_sire_dam_sire_sire', 'sire_sire_dam_sire_dam',
      'sire_sire_dam_dam_sire', 'sire_sire_dam_dam_dam',
      'sire_dam_sire_sire_sire', 'sire_dam_sire_sire_dam',
      'sire_dam_sire_dam_sire', 'sire_dam_sire_dam_dam',
      'sire_dam_dam_sire_sire', 'sire_dam_dam_sire_dam',
      'sire_dam_dam_dam_sire', 'sire_dam_dam_dam_dam',
      'dam_sire_sire_sire_sire', 'dam_sire_sire_sire_dam',
      'dam_sire_sire_dam_sire', 'dam_sire_sire_dam_dam',
      'dam_sire_dam_sire_sire', 'dam_sire_dam_sire_dam',
      'dam_sire_dam_dam_sire', 'dam_sire_dam_dam_dam',
      'dam_dam_sire_sire_sire', 'dam_dam_sire_sire_dam',
      'dam_dam_sire_dam_sire', 'dam_dam_sire_dam_dam',
      'dam_dam_dam_sire_sire', 'dam_dam_dam_sire_dam',
      'dam_dam_dam_dam_sire', 'dam_dam_dam_dam_dam'
    ];
    
    const gen5Count = gen5Fields.filter(f => (pedigreeData as Record<string, unknown>)[f] != null).length;
    console.log(`Parsed pedigree: ${pedigreeData.name}, Gen 5 ancestors found: ${gen5Count}/32`);

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
