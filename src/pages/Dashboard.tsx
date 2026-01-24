import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cat, Users, CheckSquare, Plus, Loader2, Award, Baby } from 'lucide-react';
import { ResourcesSection } from '@/components/resources/ResourcesSection';
import { useCats } from '@/hooks/useCats';
import { useLittersGrouped } from '@/hooks/useLittersNew';
import { useTasks } from '@/hooks/useTasks';
import { useJudgingResults } from '@/hooks/useJudgingResults';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LitterStatusBadge } from '@/components/litters/LitterStatusBadge';

export default function Dashboard() {
  const [birthGuideNotes, setBirthGuideNotes] = useState('');
  const [birthGuideChecklist, setBirthGuideChecklist] = useState<Record<string, boolean>>({});
  const [vetPhone, setVetPhone] = useState('');
  
  const { data: cats = [], isLoading: catsLoading } = useCats();
  const { data: littersGrouped, isLoading: littersLoading } = useLittersGrouped();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: judgingResults = [], isLoading: judgingResultsLoading } = useJudgingResults();
  
  const isLoading = catsLoading || littersLoading || tasksLoading || judgingResultsLoading;
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const activeLitters = littersGrouped?.active || [];
  const pendingLitters = littersGrouped?.pending || [];
  const plannedLitters = littersGrouped?.planned || [];
  const allLitters = littersGrouped?.all || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = [
    { label: 'Katter', value: cats.length, icon: Cat, href: '/cats', color: 'text-primary' },
    { label: 'Totalt kull', value: allLitters.length, icon: Users, href: '/litters', color: 'text-accent-foreground' },
    { label: 'Aktive kull', value: activeLitters.length, icon: Users, href: '/litters', color: 'text-green-500' },
    { label: 'Utstillingsresultater', value: judgingResults.length, icon: Award, href: '/judging-results', color: 'text-amber-500' },
    { label: 'Ventende oppgaver', value: pendingTasks.length, icon: CheckSquare, href: '/tasks', color: 'text-destructive' },
  ];

  // Combine active + pending litters for display
  const currentLitters = [...activeLitters, ...pendingLitters].slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <h1 className="page-title">Dashboard</h1>
        {/* Hurtighandlinger som små knapper øverst */}
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/cats/new"><Plus className="h-3 w-3 mr-1" /> Katt</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/litters/new"><Plus className="h-3 w-3 mr-1" /> Kull</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/judging-results/new"><Plus className="h-3 w-3 mr-1" /> Resultat</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/tasks"><Plus className="h-3 w-3 mr-1" /> Oppgave</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} to={stat.href} className="stat-card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${stat.color}`} />
                <span className="stat-value">{stat.value}</span>
              </div>
              <p className="stat-label">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Kull-oversikt */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Baby className="h-5 w-5 text-primary" />
            Kull-oversikt
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/litters">Se alle</Link>
          </Button>
        </div>
        
        {/* Status-sammendrag */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-sm font-medium text-green-700">{activeLitters.length} aktive</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            <span className="text-sm font-medium text-amber-700">{pendingLitters.length} drektighet</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span className="text-sm font-medium text-blue-700">{plannedLitters.length} planlagt</span>
          </div>
        </div>

        {currentLitters.length === 0 ? (
          <div className="text-center py-6">
            <Baby className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Ingen aktive eller ventende kull</p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link to="/litters/new"><Plus className="h-3 w-3 mr-1" /> Planlegg kull</Link>
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {currentLitters.map(litter => (
              <Link
                key={litter.id}
                to={`/litters/${litter.id}`}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{litter.name}</span>
                    <LitterStatusBadge status={litter.status as any} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {litter.status === 'active' && litter.birthDate && (
                      <>Født {new Date(litter.birthDate).toLocaleDateString('nb-NO')}</>
                    )}
                    {litter.status === 'pending' && litter.expectedDate && (
                      <>Forventet {new Date(litter.expectedDate).toLocaleDateString('nb-NO')}</>
                    )}
                    {litter.status === 'planned' && 'Planlagt'}
                    {litter.kittenCount !== null && litter.kittenCount > 0 && (
                      <> • {litter.kittenCount} kattunger</>
                    )}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Ventende oppgaver */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Ventende oppgaver</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/tasks">Se alle</Link>
            </Button>
          </div>
          {pendingTasks.length === 0 ? (
            <p className="text-muted-foreground text-sm">Ingen ventende oppgaver</p>
          ) : (
            <ul className="space-y-2">
              {pendingTasks.slice(0, 5).map(task => (
                <li key={task.id} className="flex items-center gap-2 text-sm">
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{task.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(task.dueDate).toLocaleDateString('nb-NO')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Placeholder for balanse */}
        <div className="hidden md:block"></div>
      </div>

      {/* Ressurser-seksjon */}
      <ResourcesSection
        birthGuideNotes={birthGuideNotes}
        birthGuideChecklist={birthGuideChecklist}
        vetPhone={vetPhone}
        onBirthGuideNotesChange={setBirthGuideNotes}
        onBirthGuideChecklistChange={setBirthGuideChecklist}
        onVetPhoneChange={setVetPhone}
      />
    </div>
  );
}
