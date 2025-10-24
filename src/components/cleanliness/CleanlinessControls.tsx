import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { ViewMode } from './types';

interface CleanlinessControlsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  periodOffset: number;
  onPeriodChange: (offset: number) => void;
  editMode: boolean;
  onEditModeToggle: () => void;
  canEditFloor: boolean;
  periodLabel: string;
  onSettingsOpen: () => void;
  canManageSettings: boolean;
}

export const CleanlinessControls = ({
  viewMode,
  onViewModeChange,
  periodOffset,
  onPeriodChange,
  editMode,
  onEditModeToggle,
  canEditFloor,
  periodLabel,
  onSettingsOpen,
  canManageSettings,
}: CleanlinessControlsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
      <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as ViewMode)}>
        <TabsList>
          <TabsTrigger value="week" className="gap-2">
            <Icon name="Calendar" size={16} />
            Неделя
          </TabsTrigger>
          <TabsTrigger value="month" className="gap-2">
            <Icon name="CalendarRange" size={16} />
            Месяц
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPeriodChange(periodOffset - 1)}
        >
          <Icon name="ChevronLeft" size={18} />
        </Button>
        <span className="text-sm font-medium min-w-[180px] text-center">
          {periodLabel}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPeriodChange(periodOffset + 1)}
          disabled={periodOffset >= 0}
        >
          <Icon name="ChevronRight" size={18} />
        </Button>
        {periodOffset !== 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPeriodChange(0)}
          >
            Сегодня
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        {canEditFloor && (
          <Button
            variant={editMode ? 'default' : 'outline'}
            size="sm"
            onClick={onEditModeToggle}
            className="gap-2"
          >
            <Icon name={editMode ? 'Check' : 'Edit'} size={16} />
            {editMode ? 'Готово' : 'Редактировать'}
          </Button>
        )}
        {canManageSettings && (
          <Button
            variant="outline"
            size="icon"
            onClick={onSettingsOpen}
          >
            <Icon name="Settings" size={18} />
          </Button>
        )}
      </div>
    </div>
  );
};
