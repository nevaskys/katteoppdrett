import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Star, Loader2, ZoomIn, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useJudgingResult, useDeleteJudgingResult } from '@/hooks/useJudgingResults';
import { toast } from 'sonner';

export default function JudgingResultDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: result, isLoading } = useJudgingResult(id);
  const deleteResult = useDeleteJudgingResult();
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="empty-state">
        <p>Utstillingsresultat ikke funnet</p>
        <Button asChild className="mt-4">
          <Link to="/judging-results">Tilbake</Link>
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteResult.mutateAsync(result.id);
      toast.success('Utstillingsresultat slettet');
      navigate('/judging-results');
    } catch {
      toast.error('Kunne ikke slette utstillingsresultat');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/judging-results"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="page-title flex-1">Utstillingsresultat</h1>
        <Button variant="outline" asChild>
          <Link to={`/judging-results/${result.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" /> Rediger
          </Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Slette utstillingsresultat?</AlertDialogTitle>
              <AlertDialogDescription>
                Denne handlingen kan ikke angres.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Slett</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Images */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Dommerseddel</h2>
          {result.images.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {result.images.map((img, index) => (
                <div
                  key={index}
                  className="relative aspect-[3/4] cursor-pointer group"
                  onClick={() => setZoomedImage(img)}
                >
                  <img
                    src={img}
                    alt={`Dommerseddel ${index + 1}`}
                    className="w-full h-full object-cover rounded-md"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                    <ZoomIn className="h-8 w-8 text-white" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Ingen bilder lastet opp</p>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div className="stat-card">
            <h2 className="text-lg font-semibold mb-4">Detaljer</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Dato</dt>
                <dd className="font-medium">
                  {new Date(result.date).toLocaleDateString('nb-NO')}
                </dd>
              </div>
              {result.result && (
                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground">Resultat</dt>
                  <dd>
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold">
                      {result.result}
                    </span>
                  </dd>
                </div>
              )}
              <div className="flex justify-between items-center">
                <dt className="text-muted-foreground">Katt</dt>
                <dd>
                  {result.cat ? (
                    <Link to={`/cats/${result.cat.id}`} className="text-primary hover:underline font-medium">
                      {result.cat.name}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">Ukjent</span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-muted-foreground">Dommer</dt>
                <dd className="font-medium">
                  {result.judge?.name || <span className="text-muted-foreground">Ikke angitt</span>}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-muted-foreground">Utstilling</dt>
                <dd className="font-medium">
                  {result.show?.name || <span className="text-muted-foreground">Ikke angitt</span>}
                </dd>
              </div>
              {result.myRating !== undefined && (
                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground">Min vurdering</dt>
                  <dd className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          result.myRating && result.myRating >= star
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {result.ocrText && (
            <div className="stat-card">
              <h2 className="text-lg font-semibold mb-2">Tolket tekst</h2>
              <p className="text-sm whitespace-pre-wrap">{result.ocrText}</p>
            </div>
          )}

          {result.structuredResult && (
            <div className="stat-card">
              <h2 className="text-lg font-semibold mb-2">Strukturert resultat</h2>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                {JSON.stringify(result.structuredResult, null, 2)}
              </pre>
            </div>
          )}

          {result.notes && (
            <div className="stat-card">
              <h2 className="text-lg font-semibold mb-2">Notater</h2>
              <p className="text-sm whitespace-pre-wrap">{result.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Image zoom dialog */}
      <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
        <DialogContent className="max-w-4xl p-0">
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-2 right-2 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
          >
            <X className="h-5 w-5" />
          </button>
          {zoomedImage && (
            <img
              src={zoomedImage}
              alt="Dommerseddel"
              className="w-full h-auto max-h-[90vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
