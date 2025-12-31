import { Link } from 'react-router-dom';
import { Cat, Users, ClipboardList, CheckSquare, Plus } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { cats, litters, waitlist, tasks } = useData();
  
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const totalKittens = litters.reduce((sum, l) => sum + l.kittens.length, 0);

  const stats = [
    { label: 'Cats', value: cats.length, icon: Cat, href: '/cats', color: 'text-primary' },
    { label: 'Litters', value: litters.length, icon: Users, href: '/litters', color: 'text-accent-foreground' },
    { label: 'Kittens', value: totalKittens, icon: Cat, href: '/litters', color: 'text-primary' },
    { label: 'Waitlist', value: waitlist.length, icon: ClipboardList, href: '/waitlist', color: 'text-muted-foreground' },
    { label: 'Pending Tasks', value: pendingTasks.length, icon: CheckSquare, href: '/tasks', color: 'text-destructive' },
  ];

  return (
    <div className="space-y-8">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
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

      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="stat-card">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button asChild variant="outline" className="justify-start">
              <Link to="/cats/new"><Plus className="h-4 w-4 mr-2" /> Add Cat</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/litters/new"><Plus className="h-4 w-4 mr-2" /> Add Litter</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/waitlist/new"><Plus className="h-4 w-4 mr-2" /> Add Contact</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/tasks/new"><Plus className="h-4 w-4 mr-2" /> Add Task</Link>
            </Button>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pending Tasks</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/tasks">View all</Link>
            </Button>
          </div>
          {pendingTasks.length === 0 ? (
            <p className="text-muted-foreground text-sm">No pending tasks</p>
          ) : (
            <ul className="space-y-2">
              {pendingTasks.slice(0, 5).map(task => (
                <li key={task.id} className="flex items-center gap-2 text-sm">
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{task.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(task.dueDate).toLocaleDateString()}
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
