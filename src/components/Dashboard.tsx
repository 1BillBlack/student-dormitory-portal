import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/contexts/UsersContext';
import { CreateAnnouncementDialog } from '@/components/CreateAnnouncementDialog';
import { EditAnnouncementDialog } from '@/components/EditAnnouncementDialog';
import { UsersPanel } from '@/components/UsersPanel';
import { CouncilPanel } from '@/components/CouncilPanel';
import { CleanlinessPanel } from '@/components/CleanlinessPanel';
import { useToast } from '@/hooks/use-toast';
import { UserPosition } from '@/types/auth';

type TabType = 'announcements' | 'duties' | 'cleanliness' | 'users' | 'council';



const initialAnnouncements = [
  { id: 1, title: 'Собрание студсовета', date: '2025-10-25', content: 'Приглашаем всех на общее собрание в актовом зале', priority: 'high' },
  { id: 2, title: 'График дежурств на ноябрь', date: '2025-10-24', content: 'Опубликован новый график дежурств. Проверьте свои даты!', priority: 'medium' },
  { id: 3, title: 'Техническое обслуживание', date: '2025-10-23', content: 'Завтра будет отключена вода с 10:00 до 14:00', priority: 'high' },
];

const mockDuties = [
  { id: 1, student: 'Иван Петров', room: '305', date: '2025-10-25', status: 'pending', task: 'Уборка коридора 3 этаж' },
  { id: 2, student: 'Мария Сидорова', room: '412', date: '2025-10-24', status: 'completed', task: 'Уборка кухни' },
  { id: 3, student: 'Алексей Иванов', room: '201', date: '2025-10-26', status: 'pending', task: 'Вынос мусора' },
];



export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('announcements');
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [editingAnnouncement, setEditingAnnouncement] = useState<typeof initialAnnouncements[0] | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { user, logout } = useAuth();
  const { users, updateUser, deleteUser, createUser, updateUserPositions } = useUsers();
  const { toast } = useToast();

  const canManageAnnouncements = ['manager', 'admin', 'moderator'].includes(user?.role || '');
  const canManageUsers = ['manager', 'admin', 'moderator'].includes(user?.role || '');
  const hasCouncilAccess = 
    ['manager', 'admin', 'moderator'].includes(user?.role || '') ||
    (user?.positions && user.positions.length > 0);

  const handleDeleteUser = (userId: string) => {
    deleteUser(userId);
    toast({
      title: 'Удалено',
      description: 'Пользователь удалён',
    });
  };

  const handleUpdatePositions = (userId: string, positions: UserPosition[]) => {
    updateUserPositions(userId, positions);
    toast({
      title: 'Успешно!',
      description: 'Должности обновлены',
    });
  };

  const handleAddAnnouncement = (announcement: { title: string; content: string; priority: string; date: string }) => {
    const newAnnouncement = {
      id: announcements.length + 1,
      ...announcement,
    };
    setAnnouncements([newAnnouncement, ...announcements]);
  };

  const handleEditAnnouncement = (id: number, updatedData: { title: string; content: string; priority: string }) => {
    setAnnouncements(announcements.map(a => 
      a.id === id ? { ...a, ...updatedData } : a
    ));
  };

  const handleDeleteAnnouncement = (id: number) => {
    setAnnouncements(announcements.filter(a => a.id !== id));
    setDeletingId(null);
    toast({
      title: 'Удалено',
      description: 'Объявление успешно удалено',
    });
  };

  const getRoleName = (role: string) => {
    const roles = {
      manager: 'Менеджер',
      admin: 'Администратор',
      chairman: 'Председатель студсовета',
      vice_chairman: 'Заместитель председателя',
      member: 'Участник',
    };
    return roles[role as keyof typeof roles] || role;
  };

  const getPriorityColor = (priority: string) => {
    return priority === 'high' ? 'destructive' : 'secondary';
  };

  const getStatusColor = (status: string) => {
    return status === 'completed' ? 'default' : 'secondary';
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Icon name="Home" size={22} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Студенческий портал</h1>
              <p className="text-sm text-muted-foreground">Общежитие №5</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{getRoleName(user?.role || '')}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={logout}>
              <Icon name="LogOut" size={20} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 animate-fade-in">
          <h2 className="text-2xl font-bold mb-2">Добро пожаловать, {user?.name}!</h2>
          <p className="text-muted-foreground">Комната {user?.room} • {getRoleName(user?.role || '')}</p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="animate-fade-in">
          <TabsList className={`grid w-full mb-6 h-auto p-1 ${
            canManageUsers && hasCouncilAccess ? 'grid-cols-5' : 
            canManageUsers || hasCouncilAccess ? 'grid-cols-4' : 
            'grid-cols-3'
          }`}>
            <TabsTrigger value="announcements" className="gap-2 py-3">
              <Icon name="Megaphone" size={18} />
              <span className="hidden sm:inline">Объявления</span>
            </TabsTrigger>
            <TabsTrigger value="duties" className="gap-2 py-3">
              <Icon name="ClipboardList" size={18} />
              <span className="hidden sm:inline">Отработки</span>
            </TabsTrigger>
            <TabsTrigger value="cleanliness" className="gap-2 py-3">
              <Icon name="Sparkles" size={18} />
              <span className="hidden sm:inline">Чистота</span>
            </TabsTrigger>
            {hasCouncilAccess && (
              <TabsTrigger value="council" className="gap-2 py-3">
                <Icon name="Award" size={18} />
                <span className="hidden sm:inline">Студсовет</span>
              </TabsTrigger>
            )}
            {canManageUsers && (
              <TabsTrigger value="users" className="gap-2 py-3">
                <Icon name="Users" size={18} />
                <span className="hidden sm:inline">Пользователи</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="announcements" className="space-y-4">
            {canManageAnnouncements && (
              <div className="mb-6 flex justify-end">
                <CreateAnnouncementDialog onAdd={handleAddAnnouncement} />
              </div>
            )}
            {announcements.map((announcement, index) => (
              <Card key={announcement.id} className="animate-slide-in hover:shadow-lg transition-shadow" style={{ animationDelay: `${index * 100}ms` }}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{announcement.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Icon name="Calendar" size={14} />
                        {announcement.date}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(announcement.priority)}>
                        {announcement.priority === 'high' ? 'Важно' : 'Обычное'}
                      </Badge>
                      {canManageAnnouncements && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingAnnouncement(announcement)}
                          >
                            <Icon name="Pencil" size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingId(announcement.id)}
                          >
                            <Icon name="Trash2" size={16} className="text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{announcement.content}</p>
                </CardContent>
              </Card>
            ))}
            
            <EditAnnouncementDialog
              announcement={editingAnnouncement}
              open={!!editingAnnouncement}
              onOpenChange={(open) => !open && setEditingAnnouncement(null)}
              onEdit={handleEditAnnouncement}
            />
            
            <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Удалить объявление?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Это действие нельзя отменить. Объявление будет удалено навсегда.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deletingId && handleDeleteAnnouncement(deletingId)}>
                    Удалить
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          <TabsContent value="duties" className="space-y-4">
            {mockDuties.map((duty, index) => (
              <Card key={duty.id} className="animate-slide-in hover:shadow-lg transition-shadow" style={{ animationDelay: `${index * 100}ms` }}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{duty.task}</CardTitle>
                      <CardDescription className="mt-1">
                        {duty.student} • Комната {duty.room}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(duty.status)}>
                      {duty.status === 'completed' ? 'Выполнено' : 'В ожидании'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon name="Calendar" size={14} />
                    <span>Дата: {duty.date}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="cleanliness" className="space-y-4">
            <CleanlinessPanel currentUser={user!} users={users} />
          </TabsContent>

          {canManageUsers && (
            <TabsContent value="users" className="space-y-4">
              <UsersPanel
                users={users}
                currentUser={user!}
                onUpdateUser={updateUser}
                onDeleteUser={handleDeleteUser}
                onCreateUser={createUser}
                onUpdatePositions={handleUpdatePositions}
              />
            </TabsContent>
          )}

          {hasCouncilAccess && (
            <TabsContent value="council" className="space-y-4">
              <CouncilPanel
                users={users}
                currentUser={user!}
              />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};