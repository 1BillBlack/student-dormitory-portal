-- Восстанавливаем старые хэши которые генерирует текущий бэкенд
UPDATE users SET password_hash = '866485796cfa8d7c0cf7111640205b83076433547577511d81f8030ae99ecea5' WHERE email = 'manager@dorm.ru';
UPDATE users SET password_hash = '6ca13d52ca70c883e0f0bb101e425a89e8624de51db2d2392593af6a84118090' WHERE email = 'admin@dorm.ru';
UPDATE users SET password_hash = 'ba3253876aed6bc22d4a6ff53d8406c6ad864195ed144ab5c87621b6c233b548' WHERE email = 'moderator@dorm.ru';
UPDATE users SET password_hash = '906a40c04bb1e3daada3e3b4e85a7e85c9c622e82e188c3f959bdf2ddeb0e126' WHERE email = 'vice@dorm.ru';
UPDATE users SET password_hash = 'dd130a849d7b29e5541b05d2f7f86a4acd4f1ec598c1c9438783f56bc4f0ff80' WHERE email = 'member@dorm.ru';