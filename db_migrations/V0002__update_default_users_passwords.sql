-- Обновляем пароли существующих пользователей с правильными SHA256 хешами

-- manager123 -> ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f
UPDATE users SET 
  password_hash = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
  name = 'Алексей Менеджеров',
  role = 'manager',
  room = NULL,
  room_group = NULL,
  positions = ARRAY[]::text[]
WHERE email = 'manager@dorm.ru';

-- admin123 -> 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9  
UPDATE users SET 
  password_hash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  name = 'Мария Администраторова',
  role = 'admin',
  room = NULL,
  room_group = NULL,
  positions = ARRAY[]::text[]
WHERE email = 'admin@dorm.ru';

-- moderator123 -> 14aba7d5adacc81669ee20aa41c0a3cf3bfc32f6bbb9e0db37e1ab0c15e17f8c
UPDATE users SET 
  password_hash = '14aba7d5adacc81669ee20aa41c0a3cf3bfc32f6bbb9e0db37e1ab0c15e17f8c',
  name = 'Иван Модераторов',
  role = 'resident',
  room = '310',
  room_group = NULL,
  positions = ARRAY['chairman', 'cultural_sector']::text[]
WHERE email = 'moderator@dorm.ru';

-- vice123 -> a76d0a7efa5f32b124f8de4f90e99f8f03ee94a5fc4086b7fddd8c7e4adcef08
UPDATE users SET 
  password_hash = 'a76d0a7efa5f32b124f8de4f90e99f8f03ee94a5fc4086b7fddd8c7e4adcef08',
  name = 'Елена Заместителева',
  role = 'member',
  room = '415',
  room_group = NULL,
  positions = ARRAY['vice_chairman', 'sports_sector']::text[]
WHERE email = 'vice@dorm.ru';

-- member123 -> d16f1e23b35c4c912c50ced88c26585a0cf16b9db721cd472e5e37a309e7a48b
UPDATE users SET 
  password_hash = 'd16f1e23b35c4c912c50ced88c26585a0cf16b9db721cd472e5e37a309e7a48b',
  name = 'Петр Участников',
  role = 'member',
  room = '202',
  room_group = NULL,
  positions = ARRAY['floor_2_cleanliness', 'floor_2_head']::text[]
WHERE email = 'member@dorm.ru';