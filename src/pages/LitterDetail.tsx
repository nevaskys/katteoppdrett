import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Loader2, CheckCircle, ArrowRight, Baby } from 'lucide-react';
import { useLitterById, useDeleteLitterNew, useUpdateLitterStatus } from '@/hooks/useLittersNew';
import { useCats } from '@/hooks/useCats';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';
import { LitterStatusBadge } from '@/components/litters/LitterStatusBadge';
import { PregnancyCalendar } from '@/components/litters/PregnancyCalendar';
import { BirthNotesEditor } from '@/components/litters/BirthNotesEditor';
import { KittenWeightEditor } from '@/components/litters/KittenWeightEditor';
import { KittenWeightTracker } from '@/components/litters/KittenWeightTracker';
import { KittenList } from '@/components/litters/KittenList';
import { ParentImages } from '@/components/litters/ParentImages';
import { MatingDatesEditor } from '@/components/litters/MatingDatesEditor';
import { ActiveLitterEditor } from '@/components/litters/ActiveLitterEditor';
import { QuickKittenEditor } from '@/components/litters/QuickKittenEditor';
import { LitterStatus, LITTER_STATUS_CONFIG } from '@/types/litter';
import { format, differenceInDays, addDays } from 'date-fns';
import { nb } from 'date-fns/locale';

const STATUS_FLOW: LitterStatus[] = ['planned', 'pending', 'active', 'completed'];
const GESTATION_DAYS = 65;

export default function LitterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: litter, isLoading: litterLoading } = useLitterById(id);
  const { data: cats = [], isLoading: catsLoading } = useCats();
  const deleteLitterMutation = useDeleteLitterNew();
  const updateStatusMutation = useUpdateLitterStatus();

  const isLoading = litterLoading || catsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!litter) {
    return (
      <div className="empty-state">
        <p>Kull ikke funnet</p>
        <Button asChild className="mt-4">
          <Link to="/litters">Tilbake til Kull</Link>
        </Button>
      </div>
    );
  }

  const mother = cats.find(c => c.id === litter.motherId);
  const father = cats.find(c => c.id === litter.fatherId);
  
  // Calculate days until birth for pending litters
  const matingStart = litter.matingDateFrom || litter.matingDate;
  const expectedDate = litter.expectedDate 
    ? new Date(litter.expectedDate)
    : matingStart 
      ? addDays(new Date(matingStart), GESTATION_DAYS)
      : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntilBirth = expectedDate ? differenceInDays(expectedDate, today) : null;

  const handleDelete = () => {
    deleteLitterMutation.mutate(litter.id, {
      onSuccess: () => {
        toast.success('Kull slettet');
        navigate('/litters');
      },
      onError: () => toast.error('Kunne ikke slette kull'),
    });
  };

  const currentStatusIndex = STATUS_FLOW.indexOf(litter.status);
  const nextStatus = currentStatusIndex < STATUS_FLOW.length - 1 
    ? STATUS_FLOW[currentStatusIndex + 1] 
    : null;

  const handleAdvanceStatus = () => {
    if (!nextStatus) return;
    updateStatusMutation.mutate({ id: litter.id, status: nextStatus }, {
      onSuccess: () => {
        toast.success(`Status endret til ${LITTER_STATUS_CONFIG[nextStatus].label}`);
      },
      onError: () => toast.error('Kunne ikke endre status'),
    });
  };

  const getNextStatusLabel = () => {
    switch (nextStatus) {
      case 'pending': return 'Merk som ventende (parring gjennomført)';
      case 'active': return 'Merk som aktivt (kattunger født)';
      case 'completed': return 'Merk som avsluttet';
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/litters"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="page-title">{litter.name}</h1>
          <LitterStatusBadge status={litter.status} className="mt-1" />
        </div>
        <Button variant="outline" asChild>
          <Link to={`/litters/${litter.id}/edit`}><Edit className="h-4 w-4 mr-2" /> Rediger</Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Slette dette kullet?</AlertDialogTitle>
              <AlertDialogDescription>
                Dette vil også slette alle kattunge-oppføringer. Denne handlingen kan ikke angres.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Slett</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Parent images */}
      <div className="bg-card border rounded-lg">
        <ParentImages 
          mother={mother} 
          father={father} 
          externalFatherName={litter.externalFatherName}
        />
      </div>

      {/* Days until birth banner for pending litters */}
      {litter.status === 'pending' && daysUntilBirth !== null && daysUntilBirth > 0 && (
        <div className={`rounded-lg p-4 flex items-center gap-3 ${
          daysUntilBirth <= 7 
            ? 'bg-pink-100 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-800' 
            : 'bg-accent/50 border'
        }`}>
          <Baby className={`h-5 w-5 ${daysUntilBirth <= 7 ? 'text-pink-600' : 'text-muted-foreground'}`} />
          <div>
            <p className={`font-medium ${daysUntilBirth <= 7 ? 'text-pink-700 dark:text-pink-300' : ''}`}>
              {daysUntilBirth} {daysUntilBirth === 1 ? 'dag' : 'dager'} til estimert fødsel
            </p>
            {expectedDate && (
              <p className="text-sm text-muted-foreground">
                Termin: {format(expectedDate, 'd. MMMM yyyy', { locale: nb })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Quick actions for pending litters */}
      {litter.status === 'pending' && (
        <div className="bg-card border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Hurtighandlinger</h2>
          <div className="flex flex-wrap gap-2">
            <MatingDatesEditor litter={litter} />
          </div>
        </div>
      )}

      {/* Quick actions for active litters */}
      {litter.status === 'active' && (
        <div className="bg-card border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Hurtighandlinger</h2>
          <div className="flex flex-wrap gap-2">
            <ActiveLitterEditor litter={litter} />
            <QuickKittenEditor litterId={litter.id} />
            <BirthNotesEditor litter={litter} />
            <KittenWeightEditor litterId={litter.id} />
            <KittenWeightTracker litterId={litter.id} birthDate={litter.birthDate} />
          </div>
        </div>
      )}

      {/* Dates section - single card */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Informasjon</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Parents info */}
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Mor</dt>
              <dd className="font-medium">
                {mother ? (
                  <Link to={`/cats/${mother.id}`} className="text-primary hover:underline">
                    {mother.name}
                  </Link>
                ) : 'Ikke valgt'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Far</dt>
              <dd className="font-medium">
                {father ? (
                  <Link to={`/cats/${father.id}`} className="text-primary hover:underline">
                    {father.name}
                  </Link>
                ) : litter.externalFatherName ? (
                  <span>
                    {litter.externalFatherName}
                    {litter.externalFatherPedigreeUrl && (
                      <a 
                        href={litter.externalFatherPedigreeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline ml-2"
                      >
                        (stamtavle)
                      </a>
                    )}
                  </span>
                ) : 'Ikke valgt'}
              </dd>
            </div>
          </dl>

          {/* Dates info */}
          <dl className="space-y-3 text-sm">
            {(litter.matingDateFrom || litter.matingDate) && (
              <div>
                <dt className="text-muted-foreground">Parring</dt>
                <dd className="font-medium">
                  {format(new Date(litter.matingDateFrom || litter.matingDate!), 'd. MMM yyyy', { locale: nb })}
                  {litter.matingDateTo && litter.matingDateTo !== litter.matingDateFrom && (
                    <> – {format(new Date(litter.matingDateTo), 'd. MMM yyyy', { locale: nb })}</>
                  )}
                </dd>
              </div>
            )}
            {/* Show expected date for pending, birth date for active/completed */}
            {litter.status === 'pending' && litter.expectedDate && (
              <div>
                <dt className="text-muted-foreground">Forventet fødsel</dt>
                <dd className="font-medium">{format(new Date(litter.expectedDate), 'd. MMM yyyy', { locale: nb })}</dd>
              </div>
            )}
            {(litter.status === 'active' || litter.status === 'completed') && litter.birthDate && (
              <div>
                <dt className="text-muted-foreground">Fødselsdato</dt>
                <dd className="font-medium">{format(new Date(litter.birthDate), 'd. MMM yyyy', { locale: nb })}</dd>
              </div>
            )}
            {litter.completionDate && (
              <div>
                <dt className="text-muted-foreground">Siste kattunge flyttet</dt>
                <dd className="font-medium">{format(new Date(litter.completionDate), 'd. MMM yyyy', { locale: nb })}</dd>
              </div>
            )}
            {litter.kittenCount && litter.kittenCount > 0 && (
              <div>
                <dt className="text-muted-foreground">Antall kattunger</dt>
                <dd className="font-medium">{litter.kittenCount}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Pregnancy Calendar - show for pending status */}
      {(litter.status === 'pending' || litter.status === 'active') && (litter.matingDateFrom || litter.matingDate) && (
        <PregnancyCalendar
          matingDateFrom={litter.matingDateFrom || litter.matingDate!}
          matingDateTo={litter.matingDateTo}
          expectedDate={litter.expectedDate}
          birthDate={litter.birthDate}
        />
      )}

      {/* Planning info */}
      {(litter.reasoning || litter.inbreedingCoefficient || litter.bloodTypeNotes || litter.alternativeCombinations) && (
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Planlegging</h2>
          <div className="space-y-4">
            {litter.inbreedingCoefficient && (
              <div>
                <dt className="text-sm text-muted-foreground">Innavlsprosent</dt>
                <dd className="font-medium">{litter.inbreedingCoefficient}%</dd>
              </div>
            )}
            {litter.reasoning && (
              <div>
                <dt className="text-sm text-muted-foreground">Begrunnelse</dt>
                <dd className="mt-1 whitespace-pre-wrap">{litter.reasoning}</dd>
              </div>
            )}
            {litter.bloodTypeNotes && (
              <div>
                <dt className="text-sm text-muted-foreground">Blodtype / NI-vurdering</dt>
                <dd className="mt-1 whitespace-pre-wrap">{litter.bloodTypeNotes}</dd>
              </div>
            )}
            {litter.alternativeCombinations && (
              <div>
                <dt className="text-sm text-muted-foreground">Alternative kombinasjoner</dt>
                <dd className="mt-1 whitespace-pre-wrap">{litter.alternativeCombinations}</dd>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active litter: Birth notes and kittens */}
      {(litter.status === 'active' || litter.status === 'completed') && (
        <>
          {/* Birth notes display */}
          {litter.birthNotes && (
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Fødselsnotater</h2>
              <p className="whitespace-pre-wrap">{litter.birthNotes}</p>
            </div>
          )}

          {/* Kittens list */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Kattunger</h2>
            <KittenList litterId={litter.id} />
          </div>
        </>
      )}

      {/* Pregnancy notes */}
      {litter.pregnancyNotes && (
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Drektighetsoppfølging</h2>
          <p className="whitespace-pre-wrap">{litter.pregnancyNotes}</p>
        </div>
      )}

      {/* General notes */}
      {litter.notes && (
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Notater</h2>
          <p className="whitespace-pre-wrap">{litter.notes}</p>
        </div>
      )}

      {/* Completion info */}
      {litter.status === 'completed' && (litter.evaluation || litter.buyersInfo || litter.nrrRegistered) && (
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Avslutning</h2>
          <div className="space-y-4">
            {litter.nrrRegistered && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Registrert i NRR</span>
              </div>
            )}
            {litter.buyersInfo && (
              <div>
                <dt className="text-sm text-muted-foreground">Kjøpere / Fôrverter</dt>
                <dd className="mt-1 whitespace-pre-wrap">{litter.buyersInfo}</dd>
              </div>
            )}
            {litter.evaluation && (
              <div>
                <dt className="text-sm text-muted-foreground">Evaluering</dt>
                <dd className="mt-1 whitespace-pre-wrap">{litter.evaluation}</dd>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Receipts/images display */}
      {litter.images && litter.images.length > 0 && (
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Kvitteringer og dokumenter</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {litter.images.map((url, index) => (
              <a 
                key={index} 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={url}
                  alt={`Kvittering ${index + 1}`}
                  className="w-full h-24 object-cover rounded-md border hover:opacity-80 transition-opacity"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Status workflow - moved to bottom right */}
      {nextStatus && (
        <div className="flex justify-end">
          <div className="bg-accent/50 border rounded-lg p-4 flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">Neste steg i prosessen</p>
              <p className="text-sm text-muted-foreground">{LITTER_STATUS_CONFIG[nextStatus].description}</p>
            </div>
            <Button onClick={handleAdvanceStatus} disabled={updateStatusMutation.isPending}>
              {updateStatusMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              {getNextStatusLabel()}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
