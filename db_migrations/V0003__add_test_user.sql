-- Создаем тестового пользователя с простым паролем "test"
-- SHA256("test") = 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08

INSERT INTO users (id, email, password_hash, name, role, room, room_group, positions) 
VALUES ('test-user-id', 'test@test.ru', '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', 'Тестовый Пользователь', 'resident', '100', NULL, ARRAY[]::text[])
ON CONFLICT (id) DO NOTHING;