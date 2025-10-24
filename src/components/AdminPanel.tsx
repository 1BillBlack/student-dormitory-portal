import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { User, UserPosition } from '@/types/auth';
import { UsersPanel } from '@/components/UsersPanel';
import { FloorsPanel } from '@/components/FloorsPanel';

interface AdminPanelProps {
  users: User[];
  currentUser: User;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onCreateUser: (user: User) => void;
  onUpdatePositions: (userId: string, positions: UserPosition[]) => void;
  onApproveRoom: (userId: string) => void;
  onRejectRoom: (userId: string) => void;
  canManageUsers: boolean;
  userFloor: string | null;
}

type AdminTabType = 'users' | 'floors' | 'settings';

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
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="floors" className="gap-2">
            <Icon name="ClipboardCheck" size={18} />
            <span>Запросы</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Icon name="Users" size={18} />
            <span>Пользователи</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Icon name="Settings" size={18} />
            <span>Настройки</span>
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

        <TabsContent value="settings" className="space-y-4">
          {canManageUsers ? (
            <div className="text-center text-muted-foreground py-8">
              Настройки системы будут доступны позже
            </div>
          ) : (
            <NoAccessMessage />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};