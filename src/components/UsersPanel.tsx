import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { getPositionName } from '@/utils/positions';

interface UsersPanelProps {
  users: User[];
  currentUser: User;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onCreateUser: (user: User) => void;
  onUpdatePositions: (userId: string, positions: UserPosition[]) => void;
}

export const UsersPanel = ({ users, currentUser, onUpdateUser, onDeleteUser, onCreateUser, onUpdatePositions }: UsersPanelProps) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [managingPositionsUser, setManagingPositionsUser] = useState<User | null>(null);
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

  const handleDelete = () => {
    if (deletingUserId) {
      onDeleteUser(deletingUserId);
      setDeletingUserId(null);
    }
  };

  const activeUsers = users.filter(u => !u.isFrozen);
  const frozenUsers = users.filter(u => u.isFrozen);

  const renderUserCard = (user: User) => (
    <Card key={user.id} className={user.isFrozen ? 'opacity-60' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {user.name}
              {user.isFrozen && (
                <Badge variant="outline" className="gap-1">
                  <Icon name="Snowflake" size={12} />
                  Заморожен
                </Badge>
              )}
            </CardTitle>
            <div className="space-y-1 mt-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon name="Mail" size={14} />
                {user.email}
                {user.room && (
                  <>
                    <span>•</span>
                    <Icon name="Home" size={14} />
                    Комната {user.room}
                  </>
                )}
              </div>
              {user.positions && user.positions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {user.positions.map(pos => (
                    <Badge key={pos} variant="outline" className="text-xs">
                      {getPositionName(pos)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getRoleBadgeVariant(user.role)}>
              {getRoleName(user.role)}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Icon name="MoreVertical" size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
                      onClick={() => setDeletingUserId(user.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Icon name="Trash2" size={16} className="mr-2" />
                      Удалить
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Управление пользователями</h3>
        <Button onClick={() => setCreatingUser(true)} className="gap-2">
          <Icon name="UserPlus" size={18} />
          Создать пользователя
        </Button>
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

      <AlertDialog open={!!deletingUserId} onOpenChange={(open) => !open && setDeletingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Аккаунт пользователя будет удалён навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};