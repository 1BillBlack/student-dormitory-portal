import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

const mockDuties = [
  { id: 1, student: 'Иван Петров', room: '305', date: '2025-10-25', status: 'pending', task: 'Уборка коридора 3 этаж' },
  { id: 2, student: 'Мария Сидорова', room: '412', date: '2025-10-24', status: 'completed', task: 'Уборка кухни' },
  { id: 3, student: 'Алексей Иванов', room: '201', date: '2025-10-26', status: 'pending', task: 'Вынос мусора' },
];

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const getStatusColor = (status: string) => {
  return status === 'completed' ? 'default' : 'secondary';
};

export const DutiesTab = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Дежурства</h3>
      </div>
      {mockDuties.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Icon name="Calendar" size={48} className="mx-auto mb-4 opacity-50" />
          <p>Нет дежурств</p>
        </div>
      )}
      {mockDuties.map((duty, index) => (
        <Card key={duty.id} className="animate-slide-in" style={{ animationDelay: `${index * 100}ms` }}>
          <CardHeader className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">{duty.task}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {duty.student} • Комната {duty.room}
                </p>
              </div>
              <Badge variant={getStatusColor(duty.status)}>
                {duty.status === 'completed' ? 'Выполнено' : 'Ожидает'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm text-muted-foreground">
              <Icon name="Calendar" size={14} className="inline mr-1" />
              {formatDate(duty.date)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
