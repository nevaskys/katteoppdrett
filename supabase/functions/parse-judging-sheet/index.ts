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
  result?: string;
  ocrText?: string;
  structuredResult?: {
    points?: number;
    title?: string;
    placement?: string;
    category?: string;
    class?: string;
    certificates?: string[];
    comments?: string;
    // Structured judging fields
    head?: string;
    ears?: string;
    eyes?: string;
    profile?: string;
    chin?: string;
    muzzle?: string;
    body?: string;
    legs?: string;
    tail?: string;
    coat?: string;
    texture?: string;
    color?: string;
    pattern?: string;
    condition?: string;
    general?: string;
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

    const judgingSheetPrompt = `Analyser dette bildet av en dommerseddel fra en katteutstilling (FIFe eller tilsvarende).

Ekstraher all tekst og informasjon du kan finne. Dette er typisk et håndskrevet skjema fra en dommer som vurderer en katt.

VIKTIG - Finn følgende informasjon:

1. KATTENS NAVN - Ofte øverst på skjemaet, kan være et langt navn med oppdretternavn
2. DOMMERENS NAVN - Se etter signatur nederst eller trykt navn. Dommere har ofte utenlandske navn.
3. UTSTILLINGENS NAVN/STED - Ofte trykt øverst
4. DATO - Kan være trykt eller skrevet
5. RESULTAT - SVÆRT VIKTIG! Se etter: EX 1, EX 2, EX, V (very good), G (good), NOM, BIS, BIV, CAC, CACIB, CAGCIB, CACS, CACM, HP, etc.

6. STRUKTURERTE VURDERINGSFELTER - Dommerseddelen har typisk disse feltene med håndskrevne kommentarer:
   - HODE / HEAD: Kommentar om kattens hode
   - ØRER / EARS: Kommentar om ørene
   - ØYNE / EYES: Kommentar om øynene
   - PROFIL / PROFILE: Kommentar om profilen
   - HAKE / CHIN: Kommentar om haken
   - SNUTE / MUZZLE: Kommentar om snuten
   - KROPP / BODY: Kommentar om kroppen
   - BEN / LEGS: Kommentar om bena
   - HALE / TAIL: Kommentar om halen
   - PELS / COAT: Kommentar om pelsen
   - TEKSTUR / TEXTURE: Kommentar om pelstekstur
   - FARGE / COLOR: Kommentar om fargen
   - MØNSTER / PATTERN: Kommentar om mønsteret
   - KONDISJON / CONDITION: Kommentar om kondisjonen
   - GENERELT / GENERAL: Generelle kommentarer

Returner et JSON-objekt med denne strukturen:
{
  "catName": "kattens fulle navn hvis funnet",
  "judgeName": "dommerens navn hvis funnet", 
  "showName": "utstillingens navn/sted hvis funnet",
  "date": "dato i YYYY-MM-DD format hvis funnet",
  "result": "hovedresultatet, f.eks. 'EX 1', 'EX 1 NOM', 'EX 1 CAC', 'BIS' etc.",
  "ocrText": "ALL tekst fra dommerseddelen, inkludert håndskrift, formatert leselig med linjeskift. Behold strukturen slik at hver seksjon er tydelig.",
  "structuredResult": {
    "points": tall eller null,
    "title": "tittel/klasse hvis funnet (Champion, Open, etc.)",
    "placement": "plassering hvis funnet (1, 2, BIS, BIV, NOM, etc.)",
    "category": "kategori hvis funnet",
    "class": "klasse hvis funnet",
    "certificates": ["liste", "av", "sertifikater som CAC, CACIB, etc."],
    "comments": "generelle kommentarer fra dommeren",
    "head": "kommentar om hode/head",
    "ears": "kommentar om ører/ears",
    "eyes": "kommentar om øyne/eyes",
    "profile": "kommentar om profil/profile",
    "chin": "kommentar om hake/chin",
    "muzzle": "kommentar om snute/muzzle",
    "body": "kommentar om kropp/body",
    "legs": "kommentar om ben/legs",
    "tail": "kommentar om hale/tail",
    "coat": "kommentar om pels/coat",
    "texture": "kommentar om tekstur/texture",
    "color": "kommentar om farge/color",
    "pattern": "kommentar om mønster/pattern",
    "condition": "kommentar om kondisjon/condition",
    "general": "generelle kommentarer"
  }
}

VIKTIG:
- Gjør ditt beste for å lese håndskrift, selv om det er vanskelig
- Inkluder ALL lesbar tekst i ocrText-feltet, formatert med klare seksjoner
- result-feltet skal inneholde det samlede resultatet (f.eks. "EX 1 CAC NOM BIS")
- For structuredResult, ekstraher innholdet som står ved siden av/under hver overskrift
- Bruk null for felt som ikke kan identifiseres
- Returner KUN JSON, ingen annen tekst
- Dommernavnet er ofte en signatur - prøv å tyde den`;

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
