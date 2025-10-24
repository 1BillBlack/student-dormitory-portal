import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { User, UserPosition } from '@/types/auth';
import { UsersPanel } from '@/components/UsersPanel';

interface AdminPanelProps {
  users: User[];
  currentUser: User;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onCreateUser: (user: User) => void;
  onUpdatePositions: (userId: string, positions: UserPosition[]) => void;
}

type AdminTabType = 'users' | 'floors' | 'settings';

export const AdminPanel = ({ 
  users, 
  currentUser, 
  onUpdateUser, 
  onDeleteUser, 
  onCreateUser, 
  onUpdatePositions 
}: AdminPanelProps) => {
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTabType>('users');

  return (
    <div className="space-y-4">
      <Tabs value={activeAdminTab} onValueChange={(v) => setActiveAdminTab(v as AdminTabType)}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="users" className="gap-2">
            <Icon name="Users" size={18} />
            <span>Пользователи</span>
          </TabsTrigger>
          <TabsTrigger value="floors" className="gap-2">
            <Icon name="Building" size={18} />
            <span>Этажи</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Icon name="Settings" size={18} />
            <span>Настройки</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UsersPanel
            users={users}
            currentUser={currentUser}
            onUpdateUser={onUpdateUser}
            onDeleteUser={onDeleteUser}
            onCreateUser={onCreateUser}
            onUpdatePositions={onUpdatePositions}
          />
        </TabsContent>

        <TabsContent value="floors" className="space-y-4">
          <div className="text-center text-muted-foreground py-8">
            Управление этажами будет доступно позже
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="text-center text-muted-foreground py-8">
            Настройки системы будут доступны позже
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};