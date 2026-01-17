import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const baseColors = [
  { code: 'n', name: 'Sort (black)', hex: '#1a1a1a', description: 'Dominant grunnfarge' },
  { code: 'a', name: 'Blå (blue)', hex: '#6b7b8a', description: 'Fortynnet sort (dd)' },
  { code: 'b', name: 'Sjokolade (chocolate)', hex: '#5c3317', description: 'Resessiv til sort (bb)' },
  { code: 'c', name: 'Lilac', hex: '#b8a8b8', description: 'Fortynnet sjokolade' },
  { code: 'd', name: 'Rød (red)', hex: '#d4652f', description: 'Kjønnsbundet (XO)' },
  { code: 'e', name: 'Krem (cream)', hex: '#f5d5b8', description: 'Fortynnet rød' },
  { code: 'f', name: 'Skilpadde (tortie)', hex: '#1a1a1a', description: 'Sort + rød' },
  { code: 'g', name: 'Blåskjell (blue tortie)', hex: '#6b7b8a', description: 'Blå + krem' },
  { code: 'h', name: 'Sjokolade tortie', hex: '#5c3317', description: 'Sjokolade + rød' },
  { code: 'j', name: 'Lilac tortie', hex: '#b8a8b8', description: 'Lilac + krem' },
  { code: 'o', name: 'Kanel (cinnamon)', hex: '#8b4513', description: 'Lysere enn sjokolade' },
  { code: 'p', name: 'Fawn', hex: '#d4b896', description: 'Fortynnet kanel' },
  { code: 'w', name: 'Hvit', hex: '#ffffff', description: 'Dominant hvit (W)' },
];

const patterns = [
  { code: '', name: 'Ensfarget (solid)', description: 'Ingen tegninger, jevn farge' },
  { code: '11', name: 'Shaded', description: '1/3 av håret farget' },
  { code: '12', name: 'Shell (chinchilla)', description: '1/8 av håret farget' },
  { code: '21', name: 'Ubestemt tabby', description: 'Tabby uten spesifisert mønster' },
  { code: '22', name: 'Classic/Blotched tabby', description: 'Brede bånd, sommerfuglmønster' },
  { code: '23', name: 'Mackerel tabby', description: 'Smale striper (tigermønster)' },
  { code: '24', name: 'Spotted tabby', description: 'Flekket mønster' },
  { code: '25', name: 'Ticked tabby', description: 'Agouti, stripet hår uten kroppsmønster' },
];

const whiteMarkings = [
  { code: '01', name: 'Van', description: 'Nesten helt hvit, farge kun på hode og hale' },
  { code: '02', name: 'Harlequin', description: 'Hovedsakelig hvit med større fargeflekker' },
  { code: '03', name: 'Bicolour', description: 'Ca. 1/3 til 1/2 hvit' },
  { code: '09', name: 'Ubestemt hvitt', description: 'Hvite tegninger uten spesifikasjon' },
];

const eyeColors = [
  { code: '61', name: 'Blå øyne', hex: '#4a90d9' },
  { code: '62', name: 'Oransje øyne', hex: '#d4842f' },
  { code: '63', name: 'Odd eyes', hex: 'linear-gradient(90deg, #4a90d9 50%, #d4842f 50%)' },
  { code: '64', name: 'Grønne øyne', hex: '#4a9d5a' },
];

const geneticsRules = [
  { rule: 'Rød (O) er kjønnsbundet', explanation: 'Hanner er enten OY (rød) eller oY (ikke-rød). Hunner kan være OO (rød), Oo (skilpadde) eller oo (ikke-rød).' },
  { rule: 'Skilpadde = alltid hunn', explanation: 'Siden rød er kjønnsbundet, må katten ha to X-kromosomer for å være skilpadde.' },
  { rule: 'Fortynning (d) er resessiv', explanation: 'Katten må ha dd for å vise fortynnet farge (sort→blå, rød→krem).' },
  { rule: 'Hvit (W) er dominant epistasi', explanation: 'Dominant hvit maskerer all annen farge. En hvit katt kan bære på hvilken som helst farge.' },
  { rule: 'Tabby krever Agouti (A)', explanation: 'Ensfarget katt er aa (non-agouti). Tabby krever minst én A.' },
  { rule: 'Sølv/Røyk (I) er dominant', explanation: 'Inhibitor-genet (I) hemmer pigment i underpelsen.' },
];

const examples = [
  { code: 'NFO n', meaning: 'Norsk skogkatt, sort' },
  { code: 'NFO a 22', meaning: 'Norsk skogkatt, blå classic tabby' },
  { code: 'NFO ns 22', meaning: 'Norsk skogkatt, sort sølv classic tabby' },
  { code: 'NFO f 09', meaning: 'Norsk skogkatt, sort skilpadde med hvitt' },
  { code: 'NFO d 03 22', meaning: 'Norsk skogkatt, rød bicolour classic tabby' },
  { code: 'SIB n 21 33', meaning: 'Sibir, sort tabby point (Neva Masquerade)' },
  { code: 'SIB a 09 21 33', meaning: 'Sibir, blå tabby point med hvitt' },
];

export function ColorGeneticsReference() {
  const [search, setSearch] = useState('');

  const filterItems = <T extends { code?: string; name: string; description?: string }>(items: T[]) => {
    if (!search) return items;
    const term = search.toLowerCase();
    return items.filter(item => 
      item.code?.toLowerCase().includes(term) ||
      item.name.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term)
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Søk etter farge, kode eller beskrivelse..."
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="colors">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="colors">Farger</TabsTrigger>
          <TabsTrigger value="patterns">Mønster</TabsTrigger>
          <TabsTrigger value="white">Hvitt</TabsTrigger>
          <TabsTrigger value="genetics">Arv</TabsTrigger>
          <TabsTrigger value="examples">Eksempler</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-3 mt-4">
          <p className="text-sm text-muted-foreground">Grunnfarger og deres EMS-koder</p>
          <div className="grid gap-2">
            {filterItems(baseColors).map(color => (
              <div key={color.code} className="flex items-center gap-3 p-2 border rounded-lg">
                <div 
                  className="w-8 h-8 rounded-full border shadow-sm flex-shrink-0" 
                  style={{ backgroundColor: color.hex }}
                />
                <Badge variant="outline" className="font-mono">{color.code}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{color.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{color.description}</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-3 mt-4">
          <p className="text-sm text-muted-foreground">Tegninger og mønsterkoder</p>
          <div className="grid gap-2">
            {filterItems(patterns).map(pattern => (
              <div key={pattern.code} className="flex items-center gap-3 p-3 border rounded-lg">
                <Badge variant="outline" className="font-mono min-w-[40px] justify-center">
                  {pattern.code || '—'}
                </Badge>
                <div className="flex-1">
                  <p className="font-medium text-sm">{pattern.name}</p>
                  <p className="text-xs text-muted-foreground">{pattern.description}</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="white" className="space-y-4 mt-4">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Hvite tegninger</h4>
            <div className="grid gap-2">
              {filterItems(whiteMarkings).map(marking => (
                <div key={marking.code} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Badge variant="outline" className="font-mono">{marking.code}</Badge>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{marking.name}</p>
                    <p className="text-xs text-muted-foreground">{marking.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Øyenfarge</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {eyeColors.map(eye => (
                <div key={eye.code} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div 
                    className="w-6 h-6 rounded-full border shadow-sm" 
                    style={{ background: eye.hex }}
                  />
                  <Badge variant="outline" className="font-mono">{eye.code}</Badge>
                  <span className="text-sm">{eye.name}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="genetics" className="space-y-3 mt-4">
          <p className="text-sm text-muted-foreground">Grunnleggende arveregler for kattefarge</p>
          <div className="grid gap-3">
            {geneticsRules.map((item, i) => (
              <div key={i} className="p-3 border rounded-lg space-y-1">
                <p className="font-medium text-sm">{item.rule}</p>
                <p className="text-xs text-muted-foreground">{item.explanation}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="examples" className="space-y-3 mt-4">
          <p className="text-sm text-muted-foreground">Eksempler på EMS-koder</p>
          <div className="grid gap-2">
            {examples.map((ex, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                <Badge className="font-mono bg-primary">{ex.code}</Badge>
                <span className="text-sm">{ex.meaning}</span>
              </div>
            ))}
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 mt-4">
            <h4 className="font-medium text-sm">Hvordan lese EMS-kode</h4>
            <p className="text-xs text-muted-foreground">
              <strong>Rase</strong> + <strong>Farge</strong> (+ <strong>sølv s</strong>) (+ <strong>hvitt 01-09</strong>) (+ <strong>mønster 11-25</strong>) (+ <strong>point 33</strong>) (+ <strong>øyenfarge 61-64</strong>)
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Eksempel: <code className="bg-background px-1 rounded">NFO ns 09 22</code> = Norsk skogkatt, sort sølv med hvitt, classic tabby
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
