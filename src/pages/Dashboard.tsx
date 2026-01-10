import { Link } from 'react-router-dom';
import { Cat, Users, ClipboardList, CheckSquare, Plus, Loader2, Award } from 'lucide-react';
import { useCats } from '@/hooks/useCats';
import { useLittersGrouped } from '@/hooks/useLittersNew';
import { useWaitlist } from '@/hooks/useWaitlist';
import { useTasks } from '@/hooks/useTasks';
import { useJudgingResults } from '@/hooks/useJudgingResults';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { data: cats = [], isLoading: catsLoading } = useCats();
  const { data: littersGrouped, isLoading: littersLoading } = useLittersGrouped();
  const { data: waitlist = [], isLoading: waitlistLoading } = useWaitlist();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: judgingResults = [], isLoading: judgingResultsLoading } = useJudgingResults();
  
  const isLoading = catsLoading || littersLoading || waitlistLoading || tasksLoading || judgingResultsLoading;
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const activeLitters = littersGrouped?.active?.length || 0;
  const totalLitters = littersGrouped?.all?.length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = [
    { label: 'Katter', value: cats.length, icon: Cat, href: '/cats', color: 'text-primary' },
    { label: 'Totalt kull', value: totalLitters, icon: Users, href: '/litters', color: 'text-accent-foreground' },
    { label: 'Aktive kull', value: activeLitters, icon: Users, href: '/litters', color: 'text-green-500' },
    { label: 'Utstillingsresultater', value: judgingResults.length, icon: Award, href: '/judging-results', color: 'text-amber-500' },
    { label: 'Venteliste', value: waitlist.length, icon: ClipboardList, href: '/waitlist', color: 'text-muted-foreground' },
    { label: 'Ventende oppgaver', value: pendingTasks.length, icon: CheckSquare, href: '/tasks', color: 'text-destructive' },
  ];

  return (
    <div className="space-y-8">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

      <div className="grid md:grid-cols-2 gap-6">
        {/* Hurtighandlinger */}
        <div className="stat-card">
          <h2 className="text-lg font-semibold mb-4">Hurtighandlinger</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button asChild variant="outline" className="justify-start">
              <Link to="/cats/new"><Plus className="h-4 w-4 mr-2" /> Legg til katt</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/litters/new"><Plus className="h-4 w-4 mr-2" /> Legg til kull</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/judging-results/new"><Plus className="h-4 w-4 mr-2" /> Legg til utstillingsresultat</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/waitlist"><Plus className="h-4 w-4 mr-2" /> Legg til kontakt</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/tasks"><Plus className="h-4 w-4 mr-2" /> Legg til oppgave</Link>
            </Button>
          </div>
        </div>

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
      </div>
    </div>
  );
}