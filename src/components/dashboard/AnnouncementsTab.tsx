import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { CreateAnnouncementDialog } from '@/components/CreateAnnouncementDialog';
import { EditAnnouncementDialog } from '@/components/EditAnnouncementDialog';

interface Announcement {
  id: number;
  title: string;
  content: string;
  date: string;
  audience: string;
  priority: string;
  createdBy?: string;
}

interface AnnouncementsTabProps {
  announcements: Announcement[];
  canCreateAnnouncements: boolean;
  availableAudiences: string[];
  onAddAnnouncement: (announcement: any) => void;
  onEditAnnouncement: (id: number, data: any) => void;
  onDeleteAnnouncement: (id: number) => void;
  canEditAnnouncement: (announcement: Announcement) => boolean;
  editingAnnouncement: Announcement | null;
  setEditingAnnouncement: (announcement: Announcement | null) => void;
  setDeletingId: (id: number | null) => void;
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const getAudienceName = (audience: string) => {
  const audiences: Record<string, string> = {
    all: 'Для всех',
    floor_2: '2 этаж',
    floor_3: '3 этаж',
    floor_4: '4 этаж',
    floor_5: '5 этаж',
    council: 'Студсовет',
  };
  return audiences[audience] || 'Для всех';
};

const getPriorityColor = (priority: string) => {
  return priority === 'high' ? 'destructive' : 'secondary';
};

export const AnnouncementsTab = ({
  announcements,
  canCreateAnnouncements,
  availableAudiences,
  onAddAnnouncement,
  onEditAnnouncement,
  onDeleteAnnouncement,
  canEditAnnouncement,
  editingAnnouncement,
  setEditingAnnouncement,
  setDeletingId,
}: AnnouncementsTabProps) => {
  return (
    <div className="space-y-4">
      {canCreateAnnouncements && (
        <div className="mb-6 flex justify-end">
          <CreateAnnouncementDialog 
            onAdd={onAddAnnouncement}
            availableAudiences={availableAudiences as any}
          />
        </div>
      )}
      {announcements.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Icon name="Bell" size={48} className="mx-auto mb-4 opacity-50" />
          <p>Нет объявлений</p>
        </div>
      )}
      {announcements.map((announcement, index) => (
        <Card key={announcement.id} className="animate-slide-in hover:shadow-lg transition-shadow" style={{ animationDelay: `${index * 100}ms` }}>
          <CardHeader className="p-4">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
              <div className="flex-1 min-w-0 w-full">
                <CardTitle className="text-base sm:text-lg break-words">{announcement.title}</CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="flex items-center gap-1">
                    <Icon name="Calendar" size={14} />
                    {formatDate(announcement.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="Users" size={14} />
                    {getAudienceName(announcement.audience)}
                  </span>
                  {announcement.priority === 'high' && (
                    <Badge variant={getPriorityColor(announcement.priority)} className="text-xs">
                      Важное
                    </Badge>
                  )}
                </CardDescription>
              </div>
              {canEditAnnouncement(announcement) && (
                <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditingAnnouncement(announcement)}
                    className="flex-1 sm:flex-initial"
                  >
                    <Icon name="Edit" size={16} className="mr-2" />
                    Изменить
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => setDeletingId(announcement.id)}
                    className="flex-1 sm:flex-initial"
                  >
                    <Icon name="Trash2" size={16} className="mr-2" />
                    Удалить
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm whitespace-pre-wrap break-words">{announcement.content}</p>
          </CardContent>
        </Card>
      ))}
      
      {editingAnnouncement && (
        <EditAnnouncementDialog
          announcement={editingAnnouncement}
          onEdit={onEditAnnouncement}
          onClose={() => setEditingAnnouncement(null)}
          availableAudiences={availableAudiences as any}
        />
      )}
    </div>
  );
};
