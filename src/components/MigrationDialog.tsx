import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { migrateDataFromLocalStorage, isMigrationCompleted } from '@/utils/migration';
import { initializeDefaultUsers, isFirstRun, markDatabaseInitialized } from '@/utils/initDatabase';

export const MigrationDialog = () => {
  const [open, setOpen] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [isInit, setIsInit] = useState(false);

  useEffect(() => {
    const hasLocalStorageData = 
      localStorage.getItem('dormitory_users') ||
      localStorage.getItem('dormitory_work_shifts') ||
      localStorage.getItem('dormitory_notifications') ||
      localStorage.getItem('dormitory_logs');
    
    const migrationDone = isMigrationCompleted();
    const needsInit = isFirstRun();
    
    if ((hasLocalStorageData && !migrationDone) || needsInit) {
      setIsInit(needsInit && !hasLocalStorageData);
      setOpen(true);
    }
  }, []);

  const handleMigrate = async () => {
    setMigrating(true);
    setProgress(10);
    
    try {
      if (isInit) {
        setProgress(20);
        await initializeDefaultUsers();
        setProgress(50);
        markDatabaseInitialized();
      } else {
        setProgress(30);
        const result = await migrateDataFromLocalStorage();
        setErrors(result.errors);
      }
      
      setProgress(90);
      setCompleted(true);
      setProgress(100);
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      setErrors([error.message || 'Ошибка миграции']);
    } finally {
      setMigrating(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('migration_completed', 'true');
    markDatabaseInitialized();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isInit ? 'Инициализация базы данных' : 'Миграция данных'}</DialogTitle>
          <DialogDescription>
            {isInit 
              ? 'Создание начальных пользователей и настройка базы данных.'
              : 'Обнаружены данные в локальном хранилище. Перенесите их в базу данных для безопасного хранения.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!migrating && !completed && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Icon name="Info" size={16} className="text-blue-600" />
                <span>{isInit ? 'Будут созданы:' : 'Будут перенесены:'}</span>
              </div>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-6">
                {isInit ? (
                  <>
                    <li>5 тестовых пользователей</li>
                    <li>Администраторы и менеджеры</li>
                    <li>Настройки базы данных</li>
                  </>
                ) : (
                  <>
                    <li>Пользователи и их данные</li>
                    <li>Отработки студентов</li>
                    <li>История действий</li>
                  </>
                )}
              </ul>
            </div>
          )}

          {migrating && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon name="Loader" size={16} className="animate-spin" />
                <span className="text-sm">Миграция данных...</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {completed && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <Icon name="CheckCircle" size={20} />
                <span className="font-medium">Миграция завершена!</span>
              </div>
              {errors.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-2">
                    <Icon name="AlertTriangle" size={16} />
                    <span className="text-sm font-medium">Предупреждения:</span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-yellow-600 dark:text-yellow-400 space-y-1">
                    {errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Страница будет перезагружена через 2 секунды...
              </p>
            </div>
          )}

          {!migrating && !completed && (
            <div className="flex gap-2">
              <Button onClick={handleSkip} variant="outline" className="flex-1">
                Пропустить
              </Button>
              <Button onClick={handleMigrate} className="flex-1">
                Начать миграцию
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};