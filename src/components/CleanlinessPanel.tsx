import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import { User } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/contexts/UsersContext';
import { CleanlinessControls } from './cleanliness/CleanlinessControls';
import { CleanlinessTable } from './cleanliness/CleanlinessTable';
import { CleanlinessStats } from './cleanliness/CleanlinessStats';
import { CleanlinessSettings } from './cleanliness/CleanlinessSettings';
import { useCleanlinessLogic } from './cleanliness/useCleanlinessLogic';
import { getPeriodLabel } from './cleanliness/utils';

export { getTodayRoomScore, getRoomScores } from './cleanliness/utils';

interface CleanlinesPanelProps {
  currentUser?: User;
  users?: User[];
}

export const CleanlinessPanel = ({ currentUser: propCurrentUser, users: propUsers }: CleanlinesPanelProps) => {
  const { user: contextUser } = useAuth();
  const { users: contextUsers } = useUsers();
  
  const currentUser = propCurrentUser || contextUser;
  const users = propUsers || contextUsers;

  if (!currentUser) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Icon name="AlertCircle" size={48} className="mx-auto mb-4 opacity-20" />
          <p>Необходима авторизация</p>
        </CardContent>
      </Card>
    );
  }

  const {
    data,
    selectedFloor,
    setSelectedFloor,
    viewMode,
    setViewMode,
    periodOffset,
    setPeriodOffset,
    editMode,
    setEditMode,
    settingsOpen,
    setSettingsOpen,
    deleteScoreDialog,
    setDeleteScoreDialog,
    statsRoom,
    setStatsRoom,
    statsPeriod,
    setStatsPeriod,
    settings,
    saveSettings,
    availableFloors,
    canEditAnyFloor,
    canViewAllFloors,
    canManageSettings,
    canCloseFloors,
    canEditFloor,
    canEditCell,
    handleScoreChange,
    handleDeleteScore,
    confirmDeleteScore,
    getScore,
    isRoomClosed,
    isFloorClosed,
    handleToggleRoomClosed,
    dates,
  } = useCleanlinessLogic(currentUser);

  const periodLabel = getPeriodLabel(dates, viewMode);

  if (availableFloors.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Icon name="Lock" size={48} className="mx-auto mb-4 opacity-20" />
          <p>У вас нет доступа к просмотру данных о чистоте</p>
        </CardContent>
      </Card>
    );
  }

  const currentFloor = selectedFloor || availableFloors[0];
  const rooms = settings.rooms[currentFloor?.toString()] || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Контроль чистоты</h2>
          <p className="text-sm text-muted-foreground">Журнал проверок комнат</p>
        </div>
      </div>

      <CleanlinessControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        periodOffset={periodOffset}
        onPeriodChange={setPeriodOffset}
        editMode={editMode}
        onEditModeToggle={() => setEditMode(!editMode)}
        canEditFloor={canEditFloor(currentFloor)}
        periodLabel={periodLabel}
        onSettingsOpen={() => setSettingsOpen(true)}
        canManageSettings={canManageSettings}
      />

      {canViewAllFloors && availableFloors.length > 1 && (
        <Tabs value={currentFloor?.toString()} onValueChange={(v) => setSelectedFloor(parseInt(v))}>
          <TabsList>
            {availableFloors.map((floor) => (
              <TabsTrigger key={floor} value={floor.toString()}>
                {floor} этаж
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {!canViewAllFloors && availableFloors.length === 1 && (
        <div className="text-sm text-muted-foreground">
          Этаж: {currentFloor}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Sparkles" size={20} />
            {currentFloor} этаж
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CleanlinessTable
            floor={currentFloor}
            dates={dates}
            rooms={rooms}
            data={data}
            settings={settings}
            editMode={editMode}
            canEditFloor={canEditFloor}
            canEditCell={canEditCell}
            onScoreChange={handleScoreChange}
            onDeleteScore={handleDeleteScore}
            getScore={getScore}
            isRoomClosed={isRoomClosed}
            isFloorClosed={isFloorClosed}
            onToggleRoomClosed={handleToggleRoomClosed}
          />
        </CardContent>
      </Card>

      <CleanlinessStats
        statsRoom={statsRoom}
        onStatsRoomChange={setStatsRoom}
        statsPeriod={statsPeriod}
        onStatsPeriodChange={setStatsPeriod}
        settings={settings}
      />

      <CleanlinessSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSaveSettings={saveSettings}
        viewMode={viewMode}
        dates={dates}
        selectedFloor={currentFloor}
      />

      <AlertDialog open={!!deleteScoreDialog} onOpenChange={(open) => !open && setDeleteScoreDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить оценку?</AlertDialogTitle>
            <AlertDialogDescription>
              Оценка для комнаты {deleteScoreDialog?.room} за {deleteScoreDialog?.date} будет удалена.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteScore}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};