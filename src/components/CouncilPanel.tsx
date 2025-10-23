import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User } from '@/types/auth';
import { getPositionName } from '@/utils/positions';

interface CouncilPanelProps {
  users: User[];
  currentUser: User;
}

export const CouncilPanel = ({ users, currentUser }: CouncilPanelProps) => {
  const councilMembers = users.filter(u => 
    ['manager', 'admin', 'chairman', 'vice_chairman'].includes(u.role) ||
    (u.positions && u.positions.length > 0)
  );

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

  const getRoleBadgeVariant = (role: string) => {
    if (role === 'manager') return 'default';
    if (role === 'admin') return 'secondary';
    if (role === 'chairman') return 'outline';
    return 'secondary';
  };

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-1">Состав студенческого совета</h3>
        <p className="text-sm text-muted-foreground">
          Участники студсовета и их должности
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {councilMembers.map((member) => (
          <Card 
            key={member.id} 
            className={`${member.id === currentUser.id ? 'border-primary' : ''} hover:shadow-lg transition-shadow`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {member.name}
                    {member.id === currentUser.id && (
                      <Badge variant="outline" className="gap-1">
                        <Icon name="User" size={12} />
                        Вы
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon name="Mail" size={14} />
                      {member.email}
                    </div>
                    {member.room && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon name="Home" size={14} />
                        Комната {member.room}
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant={getRoleBadgeVariant(member.role)}>
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
    </div>
  );
};
