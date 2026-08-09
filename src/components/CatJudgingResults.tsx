import { Link } from 'react-router-dom';
import { Plus, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useJudgingResults } from '@/hooks/useJudgingResults';
import { BulkResultsImport } from '@/components/BulkResultsImport';
import { Badge } from '@/components/ui/badge';

interface CatJudgingResultsProps {
  catId: string;
  catName?: string;
}

export function CatJudgingResults({ catId, catName = 'Katt' }: CatJudgingResultsProps) {
  const { data: results = [], isLoading } = useJudgingResults(catId);

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Utstillingsresultater</h2>
        <div className="flex gap-2">
          <BulkResultsImport catId={catId} catName={catName} />
          <Button asChild variant="outline" size="sm">
            <Link to={`/judging-results/new?catId=${catId}`}>
              <Plus className="h-4 w-4 mr-2" /> Legg til
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : results.length === 0 ? (
        <p className="text-muted-foreground text-sm">Ingen utstillingsresultater registrert</p>
      ) : (
        <div className="space-y-2">
          {results.map(result => (
            <Link
              key={result.id}
              to={`/judging-results/${result.id}`}
              className="block p-3 rounded-md hover:bg-muted/50 transition-colors -mx-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-sm font-medium">
                    {new Date(result.date).toLocaleDateString('nb-NO')}
                  </p>
                  {(result.show?.location || result.show?.name) && (
                    <p className="text-xs text-muted-foreground">
                      {result.show?.location || result.show?.name}
                    </p>
                  )}
                  {result.judge && (
                    <p className="text-xs text-muted-foreground">
                      Dommer: {result.judge.name}
                    </p>
                  )}
                  {result.result && (
                    <Badge variant="secondary" className="text-xs">
                      {result.result}
                    </Badge>
                  )}
                </div>

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
      )}
    </div>
  );
}
