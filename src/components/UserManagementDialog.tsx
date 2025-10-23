import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { User, UserRole } from '@/types/auth';

interface UserManagementDialogProps {
  user: User | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSave: (user: User) => void;
  mode?: 'create' | 'edit';
  currentUserRole?: UserRole;
  canEditRole?: boolean;
  trigger?: React.ReactNode;
}

export const UserManagementDialog = ({ 
  user, 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange, 
  onSave, 
  mode = 'edit', 
  currentUserRole, 
  canEditRole = true,
  trigger 
}: UserManagementDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [room, setRoom] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { toast } = useToast();

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const canResetPassword = (): boolean => {
    if (!currentUserRole) return false;
    return ['manager', 'admin', 'moderator'].includes(currentUserRole);
  };

  useEffect(() => {
    if (user && mode === 'edit') {
      setEmail(user.email);
      setName(user.name);
      setRole(user.role);
      setRoom(user.room || '');
    } else if (mode === 'create') {
      setEmail('');
      setName('');
      setRole('member');
      setRoom('');
    }
  }, [user, mode, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !name.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Заполните обязательные поля',
        variant: 'destructive',
      });
      return;
    }

    const userData: User = {
      id: user?.id || Date.now().toString(),
      email,
      name,
      role,
      room: room || undefined,
      isFrozen: user?.isFrozen || false,
    };

    onSave(userData);

    if (mode === 'edit' && newPassword && canResetPassword()) {
      toast({
        title: 'Пароль сброшен',
        description: `Новый пароль для ${name}: ${newPassword}`,
      });
      setNewPassword('');
    }
    
    if (!trigger) {
      toast({
        title: 'Успешно!',
        description: mode === 'create' ? 'Пользователь создан' : 'Пользователь обновлён',
      });
    }

    setOpen(false);
  };

  const getRoleName = (role: UserRole) => {
    const roles: Record<UserRole, string> = {
      manager: 'Менеджер',
      admin: 'Администратор',
      moderator: 'Модератор',
      member: 'Участник',
    };
    return roles[role];
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Создать пользователя' : 'Редактировать пользователя'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Создайте новый аккаунт пользователя' 
              : 'Внесите изменения в данные пользователя'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-email">Электронная почта *</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={mode === 'edit'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-name">Имя *</Label>
              <Input
                id="user-name"
                placeholder="Имя пользователя"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {canEditRole && (
              <div className="space-y-2">
                <Label htmlFor="user-role">Роль</Label>
                <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                  <SelectTrigger id="user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">{getRoleName('member')}</SelectItem>
                    <SelectItem value="moderator">{getRoleName('moderator')}</SelectItem>
                    <SelectItem value="admin">{getRoleName('admin')}</SelectItem>
                    <SelectItem value="manager">{getRoleName('manager')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="user-room">Комната</Label>
              <Input
                id="user-room"
                placeholder="Номер комнаты"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
              />
            </div>
            {mode === 'edit' && canResetPassword() && (
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="user-password">Новый пароль</Label>
                <div className="flex gap-2">
                  <Input
                    id="user-password"
                    type="password"
                    placeholder="Оставьте пустым, чтобы не менять"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  {newPassword && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setNewPassword('')}
                    >
                      <Icon name="X" size={16} />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Укажите новый пароль, чтобы сбросить пароль пользователя
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" className="gap-2">
              <Icon name="Check" size={18} />
              {mode === 'create' ? 'Создать' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};