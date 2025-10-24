import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useAnnouncements } from '@/contexts/AnnouncementsContext';
import { ScrollArea } from '@/components/ui/scroll-area';

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

export const NotificationsPopover = () => {
  const { announcements } = useAnnouncements();
  const [isOpen, setIsOpen] = useState(false);
  
  const unreadCount = announcements.filter(a => a.priority === 'high').length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative shrink-0">
          <Icon name="Bell" size={20} />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Уведомления</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} новых</Badge>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {announcements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground px-4">
              <Icon name="Bell" size={48} className="mx-auto mb-4 opacity-50" />
              <p>Нет уведомлений</p>
            </div>
          ) : (
            <div className="divide-y">
              {announcements.map((announcement) => (
                <div 
                  key={announcement.id} 
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full shrink-0 ${
                      announcement.priority === 'high' 
                        ? 'bg-red-100 dark:bg-red-900/20' 
                        : 'bg-blue-100 dark:bg-blue-900/20'
                    }`}>
                      <Icon 
                        name={announcement.priority === 'high' ? 'AlertCircle' : 'Info'} 
                        size={16}
                        className={announcement.priority === 'high' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm mb-1">{announcement.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2 break-words">
                        {announcement.content}
                      </p>
                      <div className="flex items-center gap-2">
                        <Icon name="Calendar" size={12} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(announcement.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
