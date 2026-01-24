import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Loader2, Star, FileText, Filter, X, ChevronDown, ChevronRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useJudgingResults, useJudges, JudgingResult } from '@/hooks/useJudgingResults';
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

interface JudgeGroup {
  judgeId: string;
  judgeName: string;
  results: JudgingResult[];
  cats: Set<string>;
}

export default function JudgingResultsList() {
  const { data: results = [], isLoading } = useJudgingResults();
  const { data: judges = [] } = useJudges();
  const [selectedJudgeId, setSelectedJudgeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'results' | 'judges'>('results');
  const [expandedJudges, setExpandedJudges] = useState<Set<string>>(new Set());

  const filteredResults = selectedJudgeId
    ? results.filter(r => r.judgeId === selectedJudgeId)
    : results;

  // Group results by judge
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
        });
      }
      
      const group = groups.get(result.judgeId)!;
      group.results.push(result);
      if (result.cat?.name) {
        group.cats.add(result.cat.name);
      }
    });
    
    // Sort by number of results (most first)
    return Array.from(groups.values()).sort((a, b) => b.results.length - a.results.length);
  }, [results]);

  const toggleJudgeExpanded = (judgeId: string) => {
    const newExpanded = new Set(expandedJudges);
    if (newExpanded.has(judgeId)) {
      newExpanded.delete(judgeId);
    } else {
      newExpanded.add(judgeId);
    }
    setExpandedJudges(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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

      {/* View mode toggle and filter */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex rounded-md border">
          <Button
            variant={viewMode === 'results' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-r-none"
            onClick={() => setViewMode('results')}
          >
            Resultater
          </Button>
          <Button
            variant={viewMode === 'judges' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-l-none"
            onClick={() => setViewMode('judges')}
          >
            Per dommer
          </Button>
        </div>

        {viewMode === 'results' && judges.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedJudgeId || 'all'}
              onValueChange={(value) => setSelectedJudgeId(value === 'all' ? null : value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer på dommer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle dommere</SelectItem>
                {judges.map(judge => (
                  <SelectItem key={judge.id} value={judge.id}>
                    {judge.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedJudgeId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedJudgeId(null)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {viewMode === 'judges' ? (
        // Judges grouped view
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
                open={expandedJudges.has(group.judgeId)}
                onOpenChange={() => toggleJudgeExpanded(group.judgeId)}
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
                            {group.results.length} {group.results.length === 1 ? 'bedømmelse' : 'bedømmelser'} • {group.cats.size} {group.cats.size === 1 ? 'katt' : 'katter'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-2">
                          <p className="text-xs text-muted-foreground">Katter:</p>
                          <p className="text-sm font-medium truncate max-w-[200px]">
                            {Array.from(group.cats).slice(0, 3).join(', ')}
                            {group.cats.size > 3 && ` +${group.cats.size - 3}`}
                          </p>
                        </div>
                        {expandedJudges.has(group.judgeId) ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="mt-4 pt-4 border-t space-y-2">
                      {group.results.map(result => (
                        <Link
                          key={result.id}
                          to={`/judging-results/${result.id}`}
                          className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {result.images[0] ? (
                              <img
                                src={result.images[0]}
                                alt="Dommerseddel"
                                className="w-10 h-12 object-cover rounded flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
                                <FileText className="h-4 w-4 text-muted-foreground/50" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm">{result.cat?.name || 'Ukjent katt'}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(result.date).toLocaleDateString('nb-NO')}
                                {result.show && ` • ${result.show.name}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {result.result && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                {result.result}
                              </span>
                            )}
                            {result.myRating !== undefined && (
                              <div className="flex gap-0.5">
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
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        )
      ) : (
        // Results list view
        filteredResults.length === 0 ? (
          <div className="empty-state">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {selectedJudgeId ? 'Ingen resultater for denne dommeren' : 'Ingen utstillingsresultater registrert'}
            </p>
            {!selectedJudgeId && (
              <Button asChild className="mt-4">
                <Link to="/judging-results/new">Legg til første resultat</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredResults.map(result => (
              <Link
                key={result.id}
                to={`/judging-results/${result.id}`}
                className="stat-card hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  {result.images[0] ? (
                    <img
                      src={result.images[0]}
                      alt="Dommerseddel"
                      className="w-16 h-20 object-cover rounded-md flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-20 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                      <FileText className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className="font-medium break-words">{result.cat?.name || 'Ukjent katt'}</p>
                      {result.result && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                          {result.result}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(result.date).toLocaleDateString('nb-NO')}
                    </p>
                    {result.show && (
                      <p className="text-sm text-muted-foreground truncate">{result.show.name}</p>
                    )}
                    {result.judge && (
                      <p className="text-xs text-muted-foreground truncate">Dommer: {result.judge.name}</p>
                    )}
                    {result.myRating !== undefined && (
                      <div className="flex gap-0.5 mt-1">
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
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}
