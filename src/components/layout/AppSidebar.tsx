import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Calendar,
  Stethoscope,
  FlaskConical,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  {
    title: 'Tableau de bord',
    href: '/',
    icon: LayoutDashboard
  },
  {
    title: 'Personnel',
    href: '/staff',
    icon: Users,
    roles: ['ADMIN']
  },
  {
    title: 'Dossiers Patients',
    href: '/patients',
    icon: FolderOpen,
    roles: ['ADMIN', 'MEDECIN', 'INFIRMIER', 'SECRETAIRE']
  },
  {
    title: 'Rendez-vous',
    href: '/appointments',
    icon: Calendar,
    roles: ['ADMIN', 'MEDECIN', 'SECRETAIRE']
  },
  {
    title: 'Consultations',
    href: '/consultations',
    icon: Stethoscope,
    roles: ['ADMIN', 'MEDECIN', 'INFIRMIER']
  },
  {
    title: 'Laboratoire',
    href: '/lab',
    icon: FlaskConical,
    roles: ['ADMIN', 'MEDECIN', 'TECHNICIEN']
  },
  {
    title: 'Ordonnances',
    href: '/prescriptions',
    icon: FileText,
    roles: ['ADMIN', 'MEDECIN']
  },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, hasAnyRole } = useAuth();
  const location = useLocation();

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return hasAnyRole(item.roles);
  });

  const getInitials = (nom: string, prenom: string) => {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  const NavItemContent = ({ item, isActive }: { item: NavItem; isActive: boolean }) => (
    <>
      <item.icon className={cn(
        "h-5 w-5 shrink-0 transition-colors",
        isActive ? "text-primary" : "text-muted-foreground"
      )} />
      {!collapsed && (
        <span className={cn(
          "transition-colors",
          isActive ? "text-foreground font-medium" : "text-muted-foreground"
        )}>
          {item.title}
        </span>
      )}
    </>
  );

  return (
    <aside className={cn(
      "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
      collapsed ? "w-[72px]" : "w-64"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b border-sidebar-border",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">MedInsight</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("h-8 w-8", collapsed && "absolute right-2 top-4")}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.href;

          if (collapsed) {
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.href}
                    className={cn(
                      "flex items-center justify-center p-3 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "hover:bg-sidebar-accent/50"
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  {item.title}
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/50"
              )}
            >
              <NavItemContent item={item} isActive={isActive} />
            </NavLink>
          );
        })}
      </nav>

      <Separator className="mx-3" />

      {/* User Section */}
      <div className={cn(
        "p-4",
        collapsed && "flex flex-col items-center"
      )}>
        {!collapsed && user && (
          <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-muted/50">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(user.nom, user.prenom)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                Dr. {user.prenom} {user.nom}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.specialite}
              </p>
            </div>
          </div>
        )}

        <div className={cn(
          "flex gap-2",
          collapsed ? "flex-col" : "flex-row"
        )}>
          {collapsed ? (
            <>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Paramètres</TooltipContent>
              </Tooltip>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    onClick={logout}
                  >
                    <LogOut className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Déconnexion</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="flex-1 justify-start gap-2">
                <Settings className="h-4 w-4" />
                Paramètres
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
