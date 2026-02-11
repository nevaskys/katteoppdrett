import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Loader2, Star, Filter, X, ChevronDown, ChevronRight, User, MapPin, Cat, Trophy, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useJudgingResults, useJudges, useShows, JudgingResult } from '@/hooks/useJudgingResults';
import { useCats } from '@/hooks/useCats';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

type ViewMode = 'results' | 'judges' | 'shows' | 'cats';

interface JudgeGroup {
  judgeId: string;
  judgeName: string;
  results: JudgingResult[];
  cats: Set<string>;
  avgRating: number | null;
  topResults: string[];
}

interface ShowGroup {
  showId: string;
  showName: string;
  results: JudgingResult[];
}

interface CatGroup {
  catId: string;
  catName: string;
  results: JudgingResult[];
}

export default function JudgingResultsList() {
  const { data: results = [], isLoading } = useJudgingResults();
  const { data: judges = [] } = useJudges();
  const { data: shows = [] } = useShows();
  const { data: cats = [] } = useCats();
  const [selectedJudgeId, setSelectedJudgeId] = useState<string | null>(null);
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('results');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Get unique results for filter
  const uniqueResults = useMemo(() => {
    const resultSet = new Set<string>();
    results.forEach(r => {
      if (r.result) resultSet.add(r.result);
    });
    return Array.from(resultSet).sort();
  }, [results]);

  const filteredResults = useMemo(() => {
    let filtered = results;
    if (selectedJudgeId) filtered = filtered.filter(r => r.judgeId === selectedJudgeId);
    if (selectedShowId) filtered = filtered.filter(r => r.showId === selectedShowId);
    if (selectedCatId) filtered = filtered.filter(r => r.catId === selectedCatId);
    if (selectedResult) filtered = filtered.filter(r => r.result === selectedResult);
    return filtered;
  }, [results, selectedJudgeId, selectedShowId, selectedCatId, selectedResult]);

  const hasActiveFilters = selectedJudgeId || selectedShowId || selectedCatId || selectedResult;

  const clearFilters = () => {
    setSelectedJudgeId(null);
    setSelectedShowId(null);
    setSelectedCatId(null);
    setSelectedResult(null);
  };

  // Group results by judge with analysis
  const judgeGroups = useMemo(() => {
    const groups = new Map<string, JudgeGroup>();
    
    results.forEach(result => {
      if (!result.judgeId || !result.judge) return;
      
      if (!groups.has(result.judgeId)) {
        groups.set(result.judgeId, {
          judgeId: result.judgeId,
          judgeName: result.judge.name,
          results: [],
          cats: new Set(),
          avgRating: null,
          topResults: [],
        });
      }
      
      const group = groups.get(result.judgeId)!;
      group.results.push(result);
      if (result.cat?.name) {
        group.cats.add(result.cat.name);
      }
    });
    
    // Calculate stats
    groups.forEach(group => {
      const ratings = group.results.filter(r => r.myRating !== undefined).map(r => r.myRating!);
      group.avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
      
      // Count top results (EX1, NOM, BIS, BIV)
      const topCount = group.results.filter(r => 
        r.result && /^EX\s*1|NOM|BIS|BIV|CACS|CACIB|CAGCIB/i.test(r.result)
      ).length;
      if (topCount > 0) {
        group.topResults.push(`${topCount} toppresultat${topCount > 1 ? 'er' : ''}`);
      }
    });
    
    return Array.from(groups.values()).sort((a, b) => {
      // Sort by avg rating desc, then by number of results
      if (a.avgRating !== null && b.avgRating !== null) return b.avgRating - a.avgRating;
      if (a.avgRating !== null) return -1;
      if (b.avgRating !== null) return 1;
      return b.results.length - a.results.length;
    });
  }, [results]);

  // Group results by show
  const showGroups = useMemo(() => {
    const groups = new Map<string, ShowGroup>();
    results.forEach(result => {
      if (!result.showId || !result.show) return;
      if (!groups.has(result.showId)) {
        groups.set(result.showId, { showId: result.showId, showName: result.show.name, results: [] });
      }
      groups.get(result.showId)!.results.push(result);
    });
    return Array.from(groups.values()).sort((a, b) => {
      const dateA = a.results[0]?.date || '';
      const dateB = b.results[0]?.date || '';
      return dateB.localeCompare(dateA);
    });
  }, [results]);

  // Group results by cat
  const catGroups = useMemo(() => {
    const groups = new Map<string, CatGroup>();
    results.forEach(result => {
      if (!result.catId || !result.cat) return;
      if (!groups.has(result.catId)) {
        groups.set(result.catId, { catId: result.catId, catName: result.cat.name, results: [] });
      }
      groups.get(result.catId)!.results.push(result);
    });
    return Array.from(groups.values()).sort((a, b) => b.results.length - a.results.length);
  }, [results]);

  const toggleGroupExpanded = (id: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedGroups(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderResultRow = (result: JudgingResult) => (
    <Link
      key={result.id}
      to={`/judging-results/${result.id}`}
      className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm">{result.cat?.name || 'Ukjent katt'}</p>
          {result.result && (
            <Badge variant="secondary" className="text-xs font-medium">
              {result.result}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {new Date(result.date).toLocaleDateString('nb-NO')}
          {result.show && ` · ${result.show.name}`}
        </p>
        {result.judge && (
          <p className="text-xs text-muted-foreground">
            Dommer: {result.judge.name}
          </p>
        )}
      </div>
      {result.myRating !== undefined && (
        <div className="flex gap-0.5 ml-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-3 w-3 ${
                result.myRating && result.myRating >= star
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              }`}
            />
          ))}
        </div>
      )}
    </Link>
  );

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <h1 className="page-title">Utstillingsresultater</h1>
        <Button asChild>
          <Link to="/judging-results/new">
            <Plus className="h-4 w-4 mr-2" /> Legg til
          </Link>
        </Button>
      </div>

      {/* View mode toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border overflow-hidden">
          {([
            { key: 'results' as ViewMode, label: 'Alle' },
            { key: 'cats' as ViewMode, label: 'Per katt' },
            { key: 'judges' as ViewMode, label: 'Per dommer' },
            { key: 'shows' as ViewMode, label: 'Per utstilling' },
          ]).map(({ key, label }) => (
            <Button
              key={key}
              variant={viewMode === key ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-none text-xs"
              onClick={() => setViewMode(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Filters for results view */}
      {viewMode === 'results' && (
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          
          {cats.length > 0 && (
            <Select value={selectedCatId || 'all'} onValueChange={v => setSelectedCatId(v === 'all' ? null : v)}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Katt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle katter</SelectItem>
                {cats.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {judges.length > 0 && (
            <Select value={selectedJudgeId || 'all'} onValueChange={v => setSelectedJudgeId(v === 'all' ? null : v)}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Dommer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle dommere</SelectItem>
                {judges.map(j => <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {shows.length > 0 && (
            <Select value={selectedShowId || 'all'} onValueChange={v => setSelectedShowId(v === 'all' ? null : v)}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Utstilling" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle utstillinger</SelectItem>
                {shows.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {uniqueResults.length > 0 && (
            <Select value={selectedResult || 'all'} onValueChange={v => setSelectedResult(v === 'all' ? null : v)}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Resultat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle resultater</SelectItem>
                {uniqueResults.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
              <X className="h-3 w-3 mr-1" /> Nullstill
            </Button>
          )}
        </div>
      )}

      {/* JUDGES VIEW with analysis */}
      {viewMode === 'judges' && (
        judgeGroups.length === 0 ? (
          <div className="empty-state">
            <User className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Ingen dommere registrert</p>
          </div>
        ) : (
          <div className="space-y-3">
            {judgeGroups.map(group => (
              <Collapsible
                key={group.judgeId}
                open={expandedGroups.has(group.judgeId)}
                onOpenChange={() => toggleGroupExpanded(group.judgeId)}
              >
                <div className="stat-card">
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{group.judgeName}</p>
                          <p className="text-sm text-muted-foreground">
                            {group.results.length} bedømmelse{group.results.length !== 1 && 'r'} · {group.cats.size} katt{group.cats.size !== 1 && 'er'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {group.avgRating !== null && (
                          <div className="flex items-center gap-1" title="Gjennomsnittlig vurdering">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{group.avgRating.toFixed(1)}</span>
                          </div>
                        )}
                        {group.topResults.length > 0 && (
                          <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                            <Trophy className="h-3 w-3 mr-1" />
                            {group.topResults[0]}
                          </Badge>
                        )}
                        {expandedGroups.has(group.judgeId) ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="mt-4 pt-4 border-t space-y-1">
                      {group.results.map(renderResultRow)}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        )
      )}

      {/* SHOWS VIEW */}
      {viewMode === 'shows' && (
        showGroups.length === 0 ? (
          <div className="empty-state">
            <MapPin className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Ingen utstillinger registrert</p>
          </div>
        ) : (
          <div className="space-y-3">
            {showGroups.map(group => (
              <Collapsible
                key={group.showId}
                open={expandedGroups.has(group.showId)}
                onOpenChange={() => toggleGroupExpanded(group.showId)}
              >
                <div className="stat-card">
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{group.showName}</p>
                          <p className="text-sm text-muted-foreground">
                            {group.results.length} resultat{group.results.length !== 1 && 'er'}
                            {group.results[0]?.date && ` · ${new Date(group.results[0].date).toLocaleDateString('nb-NO')}`}
                          </p>
                        </div>
                      </div>
                      {expandedGroups.has(group.showId) ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-4 pt-4 border-t space-y-1">
                      {group.results.map(renderResultRow)}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        )
      )}

      {/* CATS VIEW */}
      {viewMode === 'cats' && (
        catGroups.length === 0 ? (
          <div className="empty-state">
            <Cat className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Ingen resultater registrert</p>
          </div>
        ) : (
          <div className="space-y-3">
            {catGroups.map(group => (
              <Collapsible
                key={group.catId}
                open={expandedGroups.has(group.catId)}
                onOpenChange={() => toggleGroupExpanded(group.catId)}
              >
                <div className="stat-card">
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <Cat className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{group.catName}</p>
                          <p className="text-sm text-muted-foreground">
                            {group.results.length} resultat{group.results.length !== 1 && 'er'}
                          </p>
                        </div>
                      </div>
                      {expandedGroups.has(group.catId) ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-4 pt-4 border-t space-y-1">
                      {group.results.map(renderResultRow)}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        )
      )}

      {/* RESULTS LIST VIEW */}
      {viewMode === 'results' && (
        filteredResults.length === 0 ? (
          <div className="empty-state">
            <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {hasActiveFilters ? 'Ingen resultater med valgte filtre' : 'Ingen utstillingsresultater registrert'}
            </p>
            {!hasActiveFilters && (
              <Button asChild className="mt-4">
                <Link to="/judging-results/new">Legg til første resultat</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredResults.map(renderResultRow)}
          </div>
        )
      )}
    </div>
  );
}
