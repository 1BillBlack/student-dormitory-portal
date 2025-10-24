import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { User, UserPosition } from '@/types/auth';
import { UsersPanel } from '@/components/UsersPanel';
import { FloorsPanel } from '@/components/FloorsPanel';
import { LogsPanel } from '@/components/LogsPanel';

interface AdminPanelProps {
  users: User[];
  currentUser: User | undefined;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onCreateUser: (user: User) => void;
  onUpdatePositions: (userId: string, positions: UserPosition[]) => void;
  onApproveRoom: (userId: string) => void;
  onRejectRoom: (userId: string) => void;
  canManageUsers: boolean;
  canViewLogs: boolean;
  userFloor: string | null;
}

type AdminTabType = 'users' | 'floors' | 'logs' | 'settings';

export const AdminPanel = ({ 
  users, 
  currentUser, 
  onUpdateUser, 
  onDeleteUser, 
  onCreateUser, 
  onUpdatePositions,
  onApproveRoom,
  onRejectRoom,
  canManageUsers,
  canViewLogs,
  userFloor
}: AdminPanelProps) => {
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTabType>(canManageUsers ? 'users' : 'floors');

  const NoAccessMessage = () => (
    <div className="text-center text-muted-foreground py-8">
      У вас нет прав для просмотра данного раздела
    </div>
  );

  return (
    <div className="space-y-4">
      <Tabs value={activeAdminTab} onValueChange={(v) => setActiveAdminTab(v as AdminTabType)}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="floors" className="gap-2">
            <Icon name="ClipboardCheck" size={18} />
            <span className="hidden sm:inline">Запросы</span>
            <span className="sm:hidden">Запр.</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Icon name="Users" size={18} />
            <span className="hidden sm:inline">Пользователи</span>
            <span className="sm:hidden">Польз.</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <Icon name="FileText" size={18} />
            <span>Логи</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Icon name="Settings" size={18} />
            <span className="hidden sm:inline">Настройки</span>
            <span className="sm:hidden">Наст.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {canManageUsers ? (
            <UsersPanel
              users={users}
              currentUser={currentUser}
              onUpdateUser={onUpdateUser}
              onDeleteUser={onDeleteUser}
              onCreateUser={onCreateUser}
              onUpdatePositions={onUpdatePositions}
            />
          ) : (
            <NoAccessMessage />
          )}
        </TabsContent>

        <TabsContent value="floors" className="space-y-4">
          <FloorsPanel
            users={users}
            currentUser={currentUser}
            onApproveRoom={onApproveRoom}
            onRejectRoom={onRejectRoom}
            userFloor={userFloor}
          />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          {canViewLogs ? (
            <LogsPanel canDelete={canManageUsers} />
          ) : (
            <NoAccessMessage />
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {canManageUsers ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Управление этажами</h3>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-4">
                    Закрытые этажи не отображаются в журнале чистоты
                  </p>
                  <div className="text-center text-muted-foreground py-4">
                    Функционал в разработке
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <NoAccessMessage />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};