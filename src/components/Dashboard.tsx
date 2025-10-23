import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';

type TabType = 'announcements' | 'duties' | 'cleanliness';

const mockAnnouncements = [
  { id: 1, title: 'Собрание студсовета', date: '2025-10-25', content: 'Приглашаем всех на общее собрание в актовом зале', priority: 'high' },
  { id: 2, title: 'График дежурств на ноябрь', date: '2025-10-24', content: 'Опубликован новый график дежурств. Проверьте свои даты!', priority: 'medium' },
  { id: 3, title: 'Техническое обслуживание', date: '2025-10-23', content: 'Завтра будет отключена вода с 10:00 до 14:00', priority: 'high' },
];

const mockDuties = [
  { id: 1, student: 'Иван Петров', room: '305', date: '2025-10-25', status: 'pending', task: 'Уборка коридора 3 этаж' },
  { id: 2, student: 'Мария Сидорова', room: '412', date: '2025-10-24', status: 'completed', task: 'Уборка кухни' },
  { id: 3, student: 'Алексей Иванов', room: '201', date: '2025-10-26', status: 'pending', task: 'Вынос мусора' },
];

const mockCleanliness = [
  { id: 1, floor: 3, area: 'Коридор', rating: 4.5, lastCheck: '2025-10-23', inspector: 'А.В. Смирнов' },
  { id: 2, floor: 2, area: 'Кухня', rating: 3.8, lastCheck: '2025-10-23', inspector: 'Е.И. Петрова' },
  { id: 3, floor: 4, area: 'Туалет', rating: 4.2, lastCheck: '2025-10-22', inspector: 'А.В. Смирнов' },
];

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('announcements');
  const { user, logout } = useAuth();

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

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-orange-600';
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
          <TabsList className="grid w-full grid-cols-3 mb-6 h-auto p-1">
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
          </TabsList>

          <TabsContent value="announcements" className="space-y-4">
            {mockAnnouncements.map((announcement, index) => (
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
                    <Badge variant={getPriorityColor(announcement.priority)}>
                      {announcement.priority === 'high' ? 'Важно' : 'Обычное'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{announcement.content}</p>
                </CardContent>
              </Card>
            ))}
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
            {mockCleanliness.map((record, index) => (
              <Card key={record.id} className="animate-slide-in hover:shadow-lg transition-shadow" style={{ animationDelay: `${index * 100}ms` }}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{record.area}</CardTitle>
                      <CardDescription className="mt-1">
                        {record.floor} этаж
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getRatingColor(record.rating)}`}>
                        {record.rating}
                      </div>
                      <div className="flex items-center gap-1 text-yellow-500">
                        {[...Array(5)].map((_, i) => (
                          <Icon 
                            key={i} 
                            name={i < Math.floor(record.rating) ? "Star" : "StarOff"} 
                            size={14} 
                            className="fill-current"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Icon name="Calendar" size={14} />
                      <span>Последняя проверка: {record.lastCheck}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="User" size={14} />
                      <span>Проверяющий: {record.inspector}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};
