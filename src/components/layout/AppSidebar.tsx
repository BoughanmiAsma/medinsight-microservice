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
  Activity,
  Sun,
  Moon,
  Monitor,
  Eye,
  Bell,
  Languages
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  titleKey: string; // Changed from 'title' to 'titleKey' to use translation keys
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  {
    titleKey: 'nav.dashboard',  // Uses translation key instead of hardcoded text
    href: '/',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'MEDECIN', 'PATIENT', 'INFIRMIER', 'SECRETAIRE']
  },
  {
    titleKey: 'nav.staff',
    href: '/staff',
    icon: Users,
    roles: ['ADMIN']
  },
  {
    titleKey: 'nav.patients',
    href: '/patients',
    icon: FolderOpen,
    roles: ['MEDECIN', 'INFIRMIER', 'SECRETAIRE', 'PATIENT']
  },
  {
    titleKey: 'nav.appointments',
    href: '/appointments',
    icon: Calendar,
    roles: ['MEDECIN', 'SECRETAIRE', 'PATIENT']
  },
  {
    titleKey: 'nav.lab',
    href: '/lab',
    icon: FlaskConical,
    roles: ['TECHNICIEN', 'LABORATOIRE']
  },
  {
    titleKey: 'nav.prescriptions',
    href: '/prescriptions',
    icon: FileText,
    roles: ['PHARMACIE']
  },
];


export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, hasAnyRole, hasRole } = useAuth();
  const { theme, setTheme, medicalMode, setMedicalMode, audioAlerts, setAudioAlerts } = useTheme();
  const { language, setLanguage, t } = useLanguage();
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
          {t(item.titleKey)}
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
            <div className="w-9 h-9 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Osmos" className="w-full h-full object-contain" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">Osmos</span>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="Osmos" className="w-full h-full object-contain" />
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
                  {t(item.titleKey)}
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
                {hasAnyRole(['MEDECIN']) ? 'Dr. ' : ''}{user.prenom} {user.nom}
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
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[350px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle>Paramètres</SheetTitle>
                  </SheetHeader>
                  <div className="py-6 space-y-8">
                    {/* Thème */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Apparence</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setTheme("light")}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                            theme === "light" ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"
                          )}
                        >
                          <Sun className="h-5 w-5" />
                          <span className="text-xs">Claire</span>
                        </button>
                        <button
                          onClick={() => setTheme("dark")}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                            theme === "dark" ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"
                          )}
                        >
                          <Moon className="h-5 w-5" />
                          <span className="text-xs">Sombre</span>
                        </button>
                        <button
                          onClick={() => setTheme("system")}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                            theme === "system" ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"
                          )}
                        >
                          <Monitor className="h-5 w-5" />
                          <span className="text-xs">Système</span>
                        </button>
                        <button
                          onClick={() => setTheme("auto")}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                            theme === "auto" ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"
                          )}
                        >
                          <Activity className="h-5 w-5" />
                          <span className="text-xs">Auto-Garde</span>
                        </button>
                      </div>
                    </div>

                    <Separator />

                    {/* Accessibilité */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Accessibilité</h4>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                        <div className="flex items-center gap-3">
                          <Eye className="h-4 w-4 text-primary" />
                          <div className="space-y-0.5">
                            <Label>Mode Nuit Médical</Label>
                            <p className="text-[10px] text-muted-foreground">Teinte douce pour les yeux</p>
                          </div>
                        </div>
                        <Switch
                          checked={medicalMode}
                          onCheckedChange={setMedicalMode}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Notifications */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Préférences</h4>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                        <div className="flex items-center gap-3">
                          <Bell className="h-4 w-4 text-primary" />
                          <Label>Notifications Sonores</Label>
                        </div>
                        <Switch
                          checked={audioAlerts}
                          onCheckedChange={setAudioAlerts}
                        />
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

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
                <TooltipContent side="right">{t('common.logout')}</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex-1 justify-start gap-2">
                    <Settings className="h-4 w-4" />
                    {t('common.settings')}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[350px] sm:w-[500px]">
                  <SheetHeader className="mb-6">
                    <SheetTitle className="text-2xl font-display">{t('settings.title')}</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-8">
                    {/* Thème avec cartes visuelles */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('settings.appearance')}</h4>
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Personnalisé</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setTheme("light")}
                          className={cn(
                            "group relative flex flex-col items-start gap-4 p-4 rounded-2xl border-2 transition-all duration-300",
                            theme === "light" ? "border-primary bg-primary/[0.02]" : "border-border hover:border-primary/50 hover:bg-muted"
                          )}
                        >
                          <div className={cn("p-2 rounded-lg", theme === "light" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                            <Sun className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Claire</p>
                            <p className="text-[10px] text-muted-foreground">Pure & Médical</p>
                          </div>
                          {theme === "light" && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />}
                        </button>

                        <button
                          onClick={() => setTheme("dark")}
                          className={cn(
                            "group relative flex flex-col items-start gap-4 p-4 rounded-2xl border-2 transition-all duration-300",
                            theme === "dark" ? "border-primary bg-primary/[0.02]" : "border-border hover:border-primary/50 hover:bg-muted"
                          )}
                        >
                          <div className={cn("p-2 rounded-lg", theme === "dark" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                            <Moon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Sombre</p>
                            <p className="text-[10px] text-muted-foreground">Nuit & Design</p>
                          </div>
                          {theme === "dark" && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />}
                        </button>

                        <button
                          onClick={() => setTheme("system")}
                          className={cn(
                            "group relative flex flex-col items-start gap-4 p-4 rounded-2xl border-2 transition-all duration-300",
                            theme === "system" ? "border-primary bg-primary/[0.02]" : "border-border hover:border-primary/50 hover:bg-muted"
                          )}
                        >
                          <div className={cn("p-2 rounded-lg", theme === "system" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                            <Monitor className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Système</p>
                            <p className="text-[10px] text-muted-foreground">Selon l'OS</p>
                          </div>
                          {theme === "system" && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />}
                        </button>

                        <button
                          onClick={() => setTheme("auto")}
                          className={cn(
                            "group relative flex flex-col items-start gap-4 p-4 rounded-2xl border-2 transition-all duration-300",
                            theme === "auto" ? "border-primary bg-primary/[0.02]" : "border-border hover:border-primary/50 hover:bg-muted"
                          )}
                        >
                          <div className={cn("p-2 rounded-lg", theme === "auto" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                            <Activity className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Auto-Garde</p>
                            <p className="text-[10px] text-muted-foreground">Sombre la nuit (20h)</p>
                          </div>
                          {theme === "auto" && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />}
                        </button>
                      </div>
                    </div>

                    <Separator />

                    {/* Langue */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Langue</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => setLanguage('fr')}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300",
                            language === 'fr' ? "border-primary bg-primary/[0.02]" : "border-border hover:border-primary/50 hover:bg-muted"
                          )}
                        >
                          <div className={cn("p-2 rounded-lg", language === 'fr' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                            <Languages className="h-5 w-5" />
                          </div>
                          <p className="text-sm font-medium">Français</p>
                          {language === 'fr' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />}
                        </button>

                        <button
                          onClick={() => setLanguage('en')}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300",
                            language === 'en' ? "border-primary bg-primary/[0.02]" : "border-border hover:border-primary/50 hover:bg-muted"
                          )}
                        >
                          <div className={cn("p-2 rounded-lg", language === 'en' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                            <Languages className="h-5 w-5" />
                          </div>
                          <p className="text-sm font-medium">English</p>
                          {language === 'en' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />}
                        </button>

                        <button
                          onClick={() => setLanguage('ar')}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300",
                            language === 'ar' ? "border-primary bg-primary/[0.02]" : "border-border hover:border-primary/50 hover:bg-muted"
                          )}
                        >
                          <div className={cn("p-2 rounded-lg", language === 'ar' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                            <Languages className="h-5 w-5" />
                          </div>
                          <p className="text-sm font-medium">العربية</p>
                          {language === 'ar' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />}
                        </button>
                      </div>
                    </div>

                    <Separator />

                    {/* Confort Visuel */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Expérience</h4>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border-2 border-transparent transition-all hover:border-primary/20">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-warning/10 text-warning">
                            <Eye className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-base">Mode Nuit Médical</Label>
                            <p className="text-xs text-muted-foreground line-clamp-1">Réduit la fatigue oculaire lors des gardes de nuit</p>
                          </div>
                        </div>
                        <Switch
                          checked={medicalMode}
                          onCheckedChange={setMedicalMode}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border-2 border-transparent transition-all hover:border-primary/20">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-info/10 text-info">
                            <Bell className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-base">Alertes Auditives</Label>
                            <p className="text-xs text-muted-foreground line-clamp-1">Notifications sonores pour les urgences</p>
                          </div>
                        </div>
                        <Switch
                          checked={audioAlerts}
                          onCheckedChange={setAudioAlerts}
                        />
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

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
