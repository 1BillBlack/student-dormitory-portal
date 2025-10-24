import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { NotificationsPopover } from '@/components/NotificationsPopover';

interface DashboardHeaderProps {
  userName: string;
  userRole: string;
  onLogout: () => void;
}

const getRoleName = (role: string) => {
  const roles = {
    manager: 'Менеджер',
    admin: 'Администратор',
    moderator: 'Модератор',
    member: 'Участник',
  };
  return roles[role as keyof typeof roles] || role;
};

export const DashboardHeader = ({ userName, userRole, onLogout }: DashboardHeaderProps) => {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <Icon name="Home" size={18} className="sm:hidden text-primary-foreground" />
            <Icon name="Home" size={22} className="hidden sm:block text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold truncate">Студенческий портал</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Общежитие №5</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">{getRoleName(userRole)}</p>
          </div>
          <NotificationsPopover />
          <Button variant="ghost" size="icon" onClick={onLogout} className="shrink-0">
            <Icon name="LogOut" size={18} className="sm:hidden" />
            <Icon name="LogOut" size={20} className="hidden sm:block" />
          </Button>
        </div>
      </div>
    </header>
  );
};
