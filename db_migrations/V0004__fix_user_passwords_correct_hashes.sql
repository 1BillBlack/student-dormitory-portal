-- Обновляем пароли всех дефолтных пользователей с правильными SHA256 хешами

-- manager123
UPDATE users SET password_hash = '9f8e0bab57529e5f888df39e59ae8d88ec67fcaebbe415a58c17c8be9c506dcb' WHERE email = 'manager@dorm.ru';

-- admin123  
UPDATE users SET password_hash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9' WHERE email = 'admin@dorm.ru';

-- moderator123
UPDATE users SET password_hash = '14aba7d5adacc81669ee20aa41c0a3cf3bfc32f6bbb9e0db37e1ab0c15e17f8c' WHERE email = 'moderator@dorm.ru';

-- vice123
UPDATE users SET password_hash = 'a76d0a7efa5f32b124f8de4f90e99f8f03ee94a5fc4086b7fddd8c7e4adcef08' WHERE email = 'vice@dorm.ru';

-- member123
UPDATE users SET password_hash = 'd16f1e23b35c4c912c50ced88c26585a0cf16b9db721cd472e5e37a309e7a48b' WHERE email = 'member@dorm.ru';