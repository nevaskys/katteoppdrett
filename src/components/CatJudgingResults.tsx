import { Link } from 'react-router-dom';
import { Plus, Star, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useJudgingResults } from '@/hooks/useJudgingResults';

interface CatJudgingResultsProps {
  catId: string;
}

export function CatJudgingResults({ catId }: CatJudgingResultsProps) {
  const { data: results = [], isLoading } = useJudgingResults(catId);

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Utstillingsresultater</h2>
        <Button asChild variant="outline" size="sm">
          <Link to={`/judging-results/new?catId=${catId}`}>
            <Plus className="h-4 w-4 mr-2" /> Legg til
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : results.length === 0 ? (
        <p className="text-muted-foreground text-sm">Ingen utstillingsresultater registrert</p>
      ) : (
        <div className="space-y-3">
          {results.map(result => (
            <Link
              key={result.id}
              to={`/judging-results/${result.id}`}
              className="flex gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors -mx-3"
            >
              {result.images[0] ? (
                <img
                  src={result.images[0]}
                  alt="Dommerseddel"
                  className="w-12 h-16 object-cover rounded flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-muted-foreground/50" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {new Date(result.date).toLocaleDateString('nb-NO')}
                </p>
                {result.show && (
                  <p className="text-sm text-muted-foreground truncate">{result.show.name}</p>
                )}
                {result.judge && (
                  <p className="text-xs text-muted-foreground truncate">
                    Dommer: {result.judge.name}
                  </p>
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
