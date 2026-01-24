import { ReactNode, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Cat, Users, CheckSquare, Home, Menu, X, Heart, LogOut, Award, Lightbulb, Settings, MessageSquarePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { toast } from 'sonner';

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  path: string;
  labelKey: string;
  icon: typeof Home;
  adminOnly?: boolean;
}

const allNavItems: NavItem[] = [
  { path: '/', labelKey: 'nav.dashboard', icon: Home },
  { path: '/cats', labelKey: 'nav.cats', icon: Cat },
  { path: '/litters', labelKey: 'nav.litters', icon: Users },
  { path: '/judging-results', labelKey: 'nav.results', icon: Award },
  { path: '/test-mating', labelKey: 'nav.testMating', icon: Heart },
  { path: '/tasks', labelKey: 'nav.tasks', icon: CheckSquare },
  { path: '/ideas', labelKey: 'nav.ideas', icon: Lightbulb, adminOnly: true },
  { path: '/suggestions', labelKey: 'nav.suggestions', icon: MessageSquarePlus },
  { path: '/settings', labelKey: 'nav.settings', icon: Settings },
];

export function Layout({ children }: LayoutProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { getCatteryDisplayName } = useProfile();
  const { isAdmin } = useIsAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const catteryName = getCatteryDisplayName();

  const navItems = useMemo(() => {
    return allNavItems.filter(item => !item.adminOnly || isAdmin);
  }, [isAdmin]);

  const handleSignOut = async () => {
    await signOut();
    toast.success(t('auth.logout'));
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Cat className="h-5 w-5 text-primary" />
          {catteryName}
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Fixed Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-40 h-screen w-64 bg-card border-r border-border flex flex-col transition-transform duration-200 ease-in-out",
        "lg:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-border hidden lg:block">
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Cat className="h-6 w-6 text-primary" />
            {catteryName}
          </h1>
        </div>
        <nav className="flex-1 p-4 pt-20 lg:pt-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="h-5 w-5" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
        
        {user && (
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              {t('nav.logout')}
            </Button>
          </div>
        )}
      </aside>

      {/* Main content - with left margin for fixed sidebar */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}