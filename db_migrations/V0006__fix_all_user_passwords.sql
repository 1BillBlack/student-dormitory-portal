-- Обновляем пароли с правильными SHA256 хэшами

-- manager123
UPDATE users SET password_hash = '8b4ab6b8e3dd26cf85b309b0938ecb6c5ab9c7b8ca9f0db6ed37c57b900ad495' WHERE email = 'manager@dorm.ru';

-- admin123
UPDATE users SET password_hash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9' WHERE email = 'admin@dorm.ru';

-- moderator123
UPDATE users SET password_hash = 'c888c9ce9e098d5864d3ded6ebcc140a12142263bace3a23a36f9905f12bd64a' WHERE email = 'moderator@dorm.ru';

-- vice123
UPDATE users SET password_hash = 'df7aae5e86b1e29e6396f046af7c4efef7b76b23e7e8b24db55d30c4e2d53b38' WHERE email = 'vice@dorm.ru';

-- member123
UPDATE users SET password_hash = 'b0b40aef8c5b8df0420001fcd461dc3b6a3c83c1e70e5764e2c1e7c0f5c4c6c3' WHERE email = 'member@dorm.ru';