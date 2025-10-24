import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterForm } from '@/components/RegisterForm';
import { useUsers } from '@/contexts/UsersContext';
import { useAnnouncements } from '@/contexts/AnnouncementsContext';

export const LoginForm = () => {
  const [showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { createUser, users } = useUsers();
  const { addAnnouncement } = useAnnouncements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await login(email, password, rememberMe);
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ошибка входа в систему');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (email: string, password: string, name: string, group: string, studyYears: number, room: string) => {
    const newUser = {
      id: Date.now().toString(),
      email,
      name,
      role: 'member' as const,
      group,
      studyYears,
      pendingRoom: room,
      roomConfirmed: false,
      registeredAt: new Date().toISOString(),
      isFrozen: false,
    };
    
    createUser(newUser);
    
    const roomNumber = parseInt(room);
    const floor = Math.floor(roomNumber / 100);
    
    const floorHeadPosition = `floor_${floor}_head`;
    const floorHeads = users.filter(u => 
      u.positions?.includes(floorHeadPosition as any) ||
      u.positions?.includes('chairman' as any) ||
      u.positions?.includes('vice_chairman' as any) ||
      ['manager', 'admin', 'moderator'].includes(u.role)
    );
    
    if (floorHeads.length > 0) {
      addAnnouncement({
        title: 'Новая заявка на комнату',
        content: `Новый участник ${name} зарегистрировался и запросил комнату ${room}`,
        priority: 'high',
        date: new Date().toISOString().split('T')[0],
      });
    }
    
    await login(email, password, false);
  };

  if (showRegister) {
    return <RegisterForm onRegister={handleRegister} onBackToLogin={() => setShowRegister(false)} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 animate-fade-in">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Icon name="Home" size={32} className="text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold">Общежитие</CardTitle>
          <CardDescription className="text-base">
            Введите электронную почту и пароль для авторизации
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Электронная почта</Label>
              <div className="relative">
                <Icon 
                  name="Mail" 
                  size={18} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="email"
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-12"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Icon 
                  name="Lock" 
                  size={18} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 h-12"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label
                htmlFor="remember"
                className="text-sm font-normal cursor-pointer"
              >
                Запомнить меня
              </Label>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                  Вход...
                </>
              ) : (
                <>
                  <Icon name="LogIn" size={20} className="mr-2" />
                  Войти
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12"
              onClick={() => setShowRegister(true)}
              disabled={isLoading}
            >
              <Icon name="UserPlus" size={20} className="mr-2" />
              Зарегистрироваться
            </Button>

            {error && (
              <Alert className="mt-4 border-destructive/50 bg-destructive/10">
                <Icon name="AlertCircle" size={16} className="text-destructive" />
                <AlertDescription className="text-sm ml-2 text-destructive">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </form>
          <Alert className="mt-4 border-primary/20 bg-primary/5">
            <Icon name="Info" size={16} className="text-primary" />
            <AlertDescription className="text-xs ml-2">
              <strong className="block mb-1">Тестовые аккаунты (любой пароль):</strong>
              <div className="space-y-0.5 font-mono">
                <div>manager@dorm.ru - Менеджер</div>
                <div>admin@dorm.ru - Администратор</div>
                <div>moderator@dorm.ru - Модератор</div>
                <div>member@dorm.ru - Участник</div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};