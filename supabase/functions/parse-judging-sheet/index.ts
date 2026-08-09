import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Kun håndskrevne kommentarer fra dommerseddelen
interface JudgingSheetFields {
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
}

interface JudgingSheetData {
  ocrText?: string;
  structuredResult?: JudgingSheetFields;
  originalResult?: JudgingSheetFields;
}

const LANGUAGE_NAMES: Record<string, string> = {
  nb: 'norsk (bokmål)', nn: 'norsk (nynorsk)', sv: 'svenska', fi: 'suomi', da: 'dansk',
  is: 'íslenska', de: 'Deutsch', nl: 'Nederlands', fr: 'français', it: 'italiano',
  es: 'español', pt: 'português', en: 'English', pl: 'polski', cs: 'čeština',
  sk: 'slovenčina', hu: 'magyar', ro: 'română', bg: 'български', hr: 'hrvatski',
  sl: 'slovenščina', sr: 'srpski', mk: 'македонски', el: 'ελληνικά', tr: 'Türkçe',
  ru: 'русский', uk: 'українська', be: 'беларуская', lv: 'latviešu', lt: 'lietuvių',
  et: 'eesti', ar: 'العربية', he: 'עברית', id: 'Bahasa Indonesia', ms: 'Bahasa Melayu',
  th: 'ไทย', zh: '中文', ja: '日本語', ko: '한국어',
};


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

    const { imageData, language } = await req.json();
    const langCode = typeof language === 'string' ? language.split('-')[0] : 'nb';
    const targetLanguage = LANGUAGE_NAMES[langCode] ?? LANGUAGE_NAMES.nb;

    
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
  "originalResult": {
    "type": "håndskrevet kommentar ved Type/Typ - ORDRETT slik det står",
    "head": "håndskrevet kommentar ved Hode/Head - ORDRETT",
    "eyes": "håndskrevet kommentar ved Øyne/Eyes - ORDRETT",
    "ears": "håndskrevet kommentar ved Ører/Ears - ORDRETT",
    "coat": "håndskrevet kommentar ved Pels/Coat - ORDRETT",
    "tail": "håndskrevet kommentar ved Hale/Tail - ORDRETT",
    "condition": "håndskrevet kommentar ved Kondisjon - ORDRETT",
    "general": "håndskrevet kommentar ved Totalinntrykk - ORDRETT",
    "result": "håndskrevet resultat",
    "judgeName": "dommerens TRYKTE navn (ikke signatur)"
  },
  "structuredResult": {
    "type": "samme kommentar OVERSATT til ${targetLanguage}",
    "head": "...",
    "eyes": "...",
    "ears": "...",
    "coat": "...",
    "tail": "...",
    "condition": "...",
    "general": "...",
    "result": "resultatkoden UENDRET (f.eks. EX1, CACS, Nom)",
    "judgeName": "dommerens navn UENDRET"
  },
  "ocrText": "all håndskrevet tekst samlet, ordrett"
}

SLIK LESER DU HÅNDSKRIFTEN NØYAKTIG:
- Studer hvert ord bokstav for bokstav. Zoom mentalt inn på uklare ord.
- Dommere skriver ofte raskt, med forkortelser og engelsk/tysk/skandinavisk blanding. Vanlige forkortelser: "Ex" (excellent), "V" (very good), "wd" (well developed), "prop." (proportions), "col." (colour), "cond." (condition), "bal." (balanced), "med." (medium), "gd" (good), "+" (pluss/bra), "-" (minus/svakhet), "→" (utvikler seg mot).
- Skriv ut åpenbare forkortelser i ORDRETT-versjonen bare når du er sikker; ellers behold slik det står.
- Vanlige fagord du kan forvente: type, boning, bonestructure, muzzle, chin, profile, forehead, slanting eyes, ear set, tufts, undercoat, guard hair, texture, ruff, britches, showcondition, temperament, nomination.
- Bruk kontekst: teksten hører til feltet den står ved (øyne-feltet handler om farge/form/plassering av øyne osv.).
- Ikke gjett vilt: hvis et ord er helt uleselig, marker det med [?] i stedet for å finne på noe.
- Ikke returner meningsløse "ord" - hvis en tolkning ikke gir faglig mening, les på nytt og velg den tolkningen som gir mening i kattespråk.

OVERSETTELSE:
- "structuredResult" skal være en naturlig, faglig oversettelse til ${targetLanguage}.
- Behold resultatkoder, titler og forkortelser som EX1, CAC, CACIB, CAGCIB, CACS, NOM, BIS uendret.
- Behold dommerens navn uendret.
- Hvis kildeteksten allerede er på ${targetLanguage}, gjenta den ryddet opp.

VIKTIG:
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

    console.log('Sending judging sheet to Lovable AI for analysis, target language:', targetLanguage);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: 'Du er en presis OCR-spesialist for håndskrift på FIFe-dommersedler for katter. Du leser rask, kursiv håndskrift korrekt og oversetter fagterminologi riktig. Du returnerer alltid gyldig JSON.'
          },
          {
            role: 'user',
            content: imageContent
          }
        ],
        max_tokens: 6000,
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
