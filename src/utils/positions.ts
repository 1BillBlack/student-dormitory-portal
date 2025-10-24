import { UserPosition } from '@/types/auth';

export const POSITION_NAMES: Record<UserPosition, string> = {
  chairman: 'Председатель студсовета общежития',
  vice_chairman: 'Заместитель председателя студсовета общежития',
  secretary: 'Секретарь студсовета общежития',
  media_sector: 'Ответственный за медиа-сектор',
  cultural_sector: 'Ответственный за культурно-массовый сектор',
  sports_sector: 'Ответственный за спортивный сектор',
  duty_supervisor: 'Ответственный за дежурства',
  household_sector: 'Ответственный за хозяйственно-бытовой сектор',
  floor_5_head: 'Староста пятого этажа',
  floor_4_head: 'Староста четвёртого этажа',
  floor_3_head: 'Староста третьего этажа',
  floor_2_head: 'Староста второго этажа',
  floor_5_cleanliness: 'Ответственный за порядок и чистоту пятого этажа',
  floor_4_cleanliness: 'Ответственный за порядок и чистоту четвёртого этажа',
  floor_3_cleanliness: 'Ответственный за порядок и чистоту третьего этажа',
  floor_2_cleanliness: 'Ответственный за порядок и чистоту второго этажа',
};

export const POSITION_HIERARCHY: UserPosition[] = [
  'chairman',
  'vice_chairman',
  'secretary',
  'media_sector',
  'cultural_sector',
  'sports_sector',
  'duty_supervisor',
  'household_sector',
  'floor_5_head',
  'floor_4_head',
  'floor_3_head',
  'floor_2_head',
  'floor_5_cleanliness',
  'floor_4_cleanliness',
  'floor_3_cleanliness',
  'floor_2_cleanliness',
];

export const getPositionName = (position: UserPosition): string => {
  return POSITION_NAMES[position] || position;
};

export const getAllPositions = (): UserPosition[] => {
  return POSITION_HIERARCHY;
};

export const getPositionRank = (position: UserPosition): number => {
  const index = POSITION_HIERARCHY.indexOf(position);
  return index === -1 ? 999 : index;
};

export const sortPositionsByRank = (positions: UserPosition[]): UserPosition[] => {
  return [...positions].sort((a, b) => getPositionRank(a) - getPositionRank(b));
};