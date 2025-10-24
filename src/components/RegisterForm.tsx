import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface RegisterFormProps {
  onRegister: (email: string, password: string, name: string, group: string, studyYears: number) => Promise<void>;
  onBackToLogin: () => void;
}

export const RegisterForm = ({ onRegister, onBackToLogin }: RegisterFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [studyYears, setStudyYears] = useState<number>(4);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateGroup = (groupValue: string): boolean => {
    const fourDigits = /^\d{4}$/;
    const oneDigitTwoThreeLetters = /^\d[А-Яа-яA-Za-z]{2,3}$/;
    
    return fourDigits.test(groupValue) || oneDigitTwoThreeLetters.test(groupValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      setIsLoading(false);
      return;
    }

    if (!validateGroup(group)) {
      setError('Группа должна состоять из 4 цифр (например, 2111) или 1 цифры и 2-3 букв (например, 2-МОС)');
      setIsLoading(false);
      return;
    }
    
    try {
      await onRegister(email, password, name, group, studyYears);
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ошибка регистрации');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 animate-fade-in">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Icon name="UserPlus" size={32} className="text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold">Регистрация</CardTitle>
          <CardDescription className="text-base">
            Создайте аккаунт для доступа к системе общежития
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">ФИО</Label>
              <div className="relative">
                <Icon 
                  name="User" 
                  size={18} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="name"
                  type="text"
                  placeholder="Иванов Иван Иванович"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="pl-10 h-11"
                />
              </div>
            </div>

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
                  className="pl-10 h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group">Номер группы</Label>
              <div className="relative">
                <Icon 
                  name="Users" 
                  size={18} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="group"
                  type="text"
                  placeholder="2111 или 2-МОС"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  required
                  className="pl-10 h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="studyYears">Срок обучения</Label>
              <Select 
                value={studyYears.toString()} 
                onValueChange={(value) => setStudyYears(parseInt(value))}
              >
                <SelectTrigger id="studyYears" className="h-11">
                  <SelectValue placeholder="Выберите срок обучения" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 года</SelectItem>
                  <SelectItem value="3">3 года</SelectItem>
                  <SelectItem value="4">4 года</SelectItem>
                  <SelectItem value="5">5 лет</SelectItem>
                  <SelectItem value="6">6 лет</SelectItem>
                </SelectContent>
              </Select>
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
                  className="pl-10 h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
              <div className="relative">
                <Icon 
                  name="Lock" 
                  size={18} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-10 h-11"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-base font-medium shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                  Регистрация...
                </>
              ) : (
                <>
                  <Icon name="UserPlus" size={20} className="mr-2" />
                  Зарегистрироваться
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={onBackToLogin}
              disabled={isLoading}
            >
              <Icon name="ArrowLeft" size={20} className="mr-2" />
              Вернуться к входу
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
        </CardContent>
      </Card>
    </div>
  );
};
