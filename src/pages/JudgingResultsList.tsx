import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Loader2, Star, FileText, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useJudgingResults, useJudges } from '@/hooks/useJudgingResults';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function JudgingResultsList() {
  const { data: results = [], isLoading } = useJudgingResults();
  const { data: judges = [] } = useJudges();
  const [selectedJudgeId, setSelectedJudgeId] = useState<string | null>(null);

  const filteredResults = selectedJudgeId
    ? results.filter(r => r.judgeId === selectedJudgeId)
    : results;

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

      {/* Filter */}
      {judges.length > 0 && (
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

      {filteredResults.length === 0 ? (
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
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{result.cat?.name || 'Ukjent katt'}</p>
                    {result.result && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
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
      )}
    </div>
  );
}
