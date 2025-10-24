import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Icon from '@/components/ui/icon';
import { User, UserPosition } from '@/types/auth';
import { UserManagementDialog } from '@/components/UserManagementDialog';
import { PositionsDialog } from '@/components/PositionsDialog';
import { useToast } from '@/hooks/use-toast';
import { getPositionName, sortPositionsByRank, getAllPositions } from '@/utils/positions';
import { canManageUser } from '@/utils/roles';

interface UsersPanelProps {
  users: User[];
  currentUser: User | undefined;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onCreateUser: (user: User) => void;
  onUpdatePositions: (userId: string, positions: UserPosition[]) => void;
}

export const UsersPanel = ({ users, currentUser, onUpdateUser, onDeleteUser, onCreateUser, onUpdatePositions }: UsersPanelProps) => {
  if (!currentUser) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Загрузка данных пользователя...
      </div>
    );
  }
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [managingPositionsUser, setManagingPositionsUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterPosition, setFilterPosition] = useState<string>('all');
  const { toast } = useToast();

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
    if (role === 'chairman') return 'outline';
    return 'secondary';
  };

  const handleToggleFreeze = (user: User) => {
    const updatedUser = { ...user, isFrozen: !user.isFrozen };
    onUpdateUser(updatedUser);
    toast({
      title: user.isFrozen ? 'Аккаунт разморожен' : 'Аккаунт заморожен',
      description: `${user.name} ${user.isFrozen ? 'может' : 'не может'} войти в систему`,
    });
  };



  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.room && user.room.includes(searchQuery));

    const matchesRole = filterRole === 'all' || user.role === filterRole;

    const matchesPosition = 
      filterPosition === 'all' || 
      (user.positions && user.positions.includes(filterPosition as UserPosition));

    return matchesSearch && matchesRole && matchesPosition;
  });

  const roleOrder = { manager: 0, admin: 1, moderator: 2, member: 3 };
  
  const sortUsersByRole = (users: User[]) => {
    return [...users].sort((a, b) => {
      const aOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 999;
      const bOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 999;
      return aOrder - bOrder;
    });
  };
  
  const activeUsers = sortUsersByRole(filteredUsers.filter(u => !u.isFrozen));
  const frozenUsers = sortUsersByRole(filteredUsers.filter(u => u.isFrozen));

  const canManageThisUser = (targetUser: User): boolean => {
    if (targetUser.id === currentUser.id) return true;
    return canManageUser(currentUser.role, targetUser.role);
  };

  const renderUserCard = (user: User) => {
    const canManage = canManageThisUser(user);

    return (
    <Card key={user.id} className={user.isFrozen ? 'opacity-60' : ''}>
      <CardHeader className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base flex flex-wrap items-center gap-2">
              <span className="truncate">{user.name}</span>
              {user.isFrozen && (
                <Badge variant="outline" className="gap-1 shrink-0">
                  <Icon name="Snowflake" size={12} />
                  <span className="hidden sm:inline">Заморожен</span>
                </Badge>
              )}
            </CardTitle>
            <div className="space-y-1 mt-2">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Icon name="Mail" size={14} />
                  <span className="break-all">{user.email}</span>
                </div>
                {user.room && (
                  <div className="flex items-center gap-1">
                    <span>•</span>
                    <Icon name="Home" size={14} />
                    <span>Комната {user.room}</span>
                  </div>
                )}
              </div>
              {user.positions && user.positions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {sortPositionsByRank(user.positions).map(pos => (
                    <Badge key={pos} variant="outline" className="text-xs">
                      {getPositionName(pos)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            <Badge variant={getRoleBadgeVariant(user.role)} className="shrink-0">
              {getRoleName(user.role)}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Icon name="MoreVertical" size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canManage ? (
                  <>
                    <DropdownMenuItem onClick={() => setEditingUser(user)}>
                      <Icon name="Pencil" size={16} className="mr-2" />
                      {user.id === currentUser.id ? 'Редактировать профиль' : 'Редактировать'}
                    </DropdownMenuItem>
                    {user.id !== currentUser.id && (
                      <>
                        <DropdownMenuItem onClick={() => setManagingPositionsUser(user)}>
                          <Icon name="Briefcase" size={16} className="mr-2" />
                          Управление должностями
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleFreeze(user)}>
                          <Icon name={user.isFrozen ? "Flame" : "Snowflake"} size={16} className="mr-2" />
                          {user.isFrozen ? 'Разморозить' : 'Заморозить'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDeleteUser(user.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Icon name="Trash2" size={16} className="mr-2" />
                          Удалить
                        </DropdownMenuItem>
                      </>
                    )}
                  </>
                ) : (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    Нет прав для управления
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-lg font-semibold">Управление пользователями</h3>
        <Button onClick={() => setCreatingUser(true)} className="gap-2 w-full sm:w-auto">
          <Icon name="UserPlus" size={18} />
          <span className="hidden sm:inline">Создать пользователя</span>
          <span className="sm:hidden">Создать</span>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          placeholder="Поиск по имени, почте, комнате..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger>
            <SelectValue placeholder="Роль" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все роли</SelectItem>
            <SelectItem value="manager">Менеджер</SelectItem>
            <SelectItem value="admin">Администратор</SelectItem>
            <SelectItem value="moderator">Модератор</SelectItem>
            <SelectItem value="member">Участник</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPosition} onValueChange={setFilterPosition}>
          <SelectTrigger>
            <SelectValue placeholder="Должность" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все должности</SelectItem>
            {getAllPositions().map(pos => (
              <SelectItem key={pos} value={pos}>
                {getPositionName(pos)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeUsers.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-medium text-muted-foreground">Активные пользователи ({activeUsers.length})</h4>
          <div className="grid gap-4">
            {activeUsers.map(renderUserCard)}
          </div>
        </div>
      )}

      {frozenUsers.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-medium text-muted-foreground flex items-center gap-2">
            <Icon name="Snowflake" size={16} />
            Замороженные пользователи ({frozenUsers.length})
          </h4>
          <div className="grid gap-4">
            {frozenUsers.map(renderUserCard)}
          </div>
        </div>
      )}

      <UserManagementDialog
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        onSave={(user) => {
          onUpdateUser(user);
          setEditingUser(null);
        }}
        mode="edit"
        currentUserRole={currentUser.role}
        currentUserId={currentUser.id}
        canEditRole={editingUser?.id !== currentUser.id}
      />

      <UserManagementDialog
        user={null}
        open={creatingUser}
        onOpenChange={setCreatingUser}
        onSave={(user) => {
          onCreateUser(user);
          setCreatingUser(false);
        }}
        mode="create"
        currentUserRole={currentUser.role}
        currentUserId={currentUser.id}
      />

      <PositionsDialog
        user={managingPositionsUser}
        open={!!managingPositionsUser}
        onOpenChange={(open) => !open && setManagingPositionsUser(null)}
        onSave={(userId, positions) => {
          onUpdatePositions(userId, positions);
          setManagingPositionsUser(null);
        }}
      />
    </div>
  );
};