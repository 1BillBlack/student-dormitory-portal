import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { User } from '@/types/auth';
import { getPositionName } from '@/utils/positions';
import { CouncilTasksPanel } from '@/components/CouncilTasksPanel';

interface CouncilPanelProps {
  users: User[];
  currentUser: User;
  onTaskCreated?: (taskTitle: string) => void;
  onTaskUpdated?: (taskTitle: string) => void;
  onTaskDeleted?: (taskTitle: string) => void;
}

export const CouncilPanel = ({ users, currentUser, onTaskCreated, onTaskUpdated, onTaskDeleted }: CouncilPanelProps) => {
  const [activeTab, setActiveTab] = useState<'members' | 'tasks'>('tasks');
  
  const councilMembers = users.filter(u => 
    u.positions && u.positions.length > 0
  );

  const canManageTasks = ['manager', 'admin', 'moderator'].includes(currentUser.role);

  const getRoleName = (role: string) => {
    const roles = {
      manager: 'Менеджер',
      admin: 'Администратор',
      moderator: 'Модератор',
      member: 'Участник',
    };
    return roles[role as keyof typeof roles] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    if (role === 'manager') return 'default';
    if (role === 'admin') return 'secondary';
    if (role === 'moderator') return 'outline';
    return 'secondary';
  };

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'members' | 'tasks')}>
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="tasks" className="gap-2">
          <Icon name="CheckSquare" size={18} />
          Задачи
        </TabsTrigger>
        <TabsTrigger value="members" className="gap-2">
          <Icon name="Users" size={18} />
          Состав
        </TabsTrigger>
      </TabsList>

      <TabsContent value="tasks">
        <CouncilTasksPanel 
          canManage={canManageTasks} 
          userName={currentUser.name} 
          councilMembers={councilMembers}
          onTaskCreated={onTaskCreated}
          onTaskUpdated={onTaskUpdated}
          onTaskDeleted={onTaskDeleted}
        />
      </TabsContent>

      <TabsContent value="members" className="space-y-4">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-1">Состав студенческого совета</h3>
          <p className="text-sm text-muted-foreground">
            Участники студсовета и их должности
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {councilMembers.map((member) => (
            <Card 
              key={member.id} 
              className={`${member.id === currentUser.id ? 'border-primary' : ''} hover:shadow-lg transition-shadow`}
            >
              <CardHeader className="p-4">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 w-full">
                    <CardTitle className="text-base flex flex-wrap items-center gap-2">
                      <span className="truncate">{member.name}</span>
                      {member.id === currentUser.id && (
                        <Badge variant="outline" className="gap-1 shrink-0">
                          <Icon name="User" size={12} />
                          Вы
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground break-all">
                        <Icon name="Mail" size={14} className="shrink-0" />
                        <span>{member.email}</span>
                      </div>
                      {member.room && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Icon name="Home" size={14} className="shrink-0" />
                          <span>Комната {member.room}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={getRoleBadgeVariant(member.role)} className="shrink-0 self-start sm:self-center">
                    {getRoleName(member.role)}
                  </Badge>
                </div>
              </CardHeader>
              {member.positions && member.positions.length > 0 && (
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Icon name="Briefcase" size={14} />
                      Должности:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {member.positions.map(pos => (
                        <Badge key={pos} variant="outline" className="text-xs">
                          {getPositionName(pos)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {councilMembers.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Icon name="Users" size={48} className="mx-auto mb-4 opacity-20" />
              <p>Состав студсовета пока не сформирован</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
};