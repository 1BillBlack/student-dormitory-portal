import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardTabs } from './dashboard/DashboardTabs';
import { useDashboardLogic } from './dashboard/useDashboardLogic';

const getRoleName = (role: string) => {
  const roles = {
    manager: 'Менеджер',
    admin: 'Администратор',
    moderator: 'Модератор',
    member: 'Участник',
  };
  return roles[role as keyof typeof roles] || role;
};

export const Dashboard = () => {
  const {
    activeTab,
    setActiveTab,
    editingAnnouncement,
    setEditingAnnouncement,
    deletingId,
    setDeletingId,
    deletingUserId,
    setDeletingUserId,
    statsPeriod,
    setStatsPeriod,
    user,
    logout,
    users,
    announcements,
    canCreateAnnouncements,
    canManageUsers,
    hasCouncilAccess,
    canSeeCleanlinessTab,
    canSeeAdminPanel,
    isFloorManager,
    canViewLogs,
    userFloor,
    pendingRoomsCount,
    confirmDeleteUser,
    handleUpdateUser,
    handleUpdatePositions,
    handleChangeRoom,
    handleApproveRoom,
    handleRejectRoom,
    handleAddAnnouncement,
    handleEditAnnouncement,
    handleDeleteAnnouncement,
    canEditAnnouncement,
    getAvailableAudiences,
    createUser,
  } = useDashboardLogic();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <DashboardHeader
        userName={user?.name || ''}
        userRole={user?.role || ''}
        onLogout={logout}
      />

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6 animate-fade-in">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Добро пожаловать, {user?.name}!</h2>
          <p className="text-sm sm:text-base text-muted-foreground">{user?.room ? `Комната ${user.room} • ` : ''}{getRoleName(user?.role || '')}</p>
        </div>

        <DashboardTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          user={user}
          canCreateAnnouncements={canCreateAnnouncements}
          canSeeCleanlinessTab={canSeeCleanlinessTab}
          hasCouncilAccess={hasCouncilAccess}
          canSeeAdminPanel={canSeeAdminPanel}
          pendingRoomsCount={pendingRoomsCount}
          filteredAnnouncements={announcements}
          availableAudiences={getAvailableAudiences()}
          onAddAnnouncement={handleAddAnnouncement}
          onEditAnnouncement={handleEditAnnouncement}
          onDeleteAnnouncement={handleDeleteAnnouncement}
          canEditAnnouncement={canEditAnnouncement}
          editingAnnouncement={editingAnnouncement}
          setEditingAnnouncement={setEditingAnnouncement}
          setDeletingId={setDeletingId}
          onChangeRoom={handleChangeRoom}
          statsPeriod={statsPeriod}
          onStatsPeriodChange={setStatsPeriod}
          users={users}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={setDeletingUserId}
          onCreateUser={createUser}
          onUpdatePositions={handleUpdatePositions}
          onApproveRoom={handleApproveRoom}
          onRejectRoom={handleRejectRoom}
          setDeletingUserId={setDeletingUserId}
          canManageUsers={canManageUsers}
          isFloorManager={isFloorManager}
          userFloor={userFloor}
          canViewLogs={canViewLogs}
        />
      </main>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить объявление?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Объявление будет удалено навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && handleDeleteAnnouncement(deletingId)}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingUserId} onOpenChange={(open) => !open && setDeletingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Пользователь будет удалён из системы.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
