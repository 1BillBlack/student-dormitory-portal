-- Store plain passwords since backend hashes them on login
-- Backend hashes password, so DB should contain plain text

UPDATE users SET password_hash = 'manager' WHERE email = 'manager@dorm.ru';
UPDATE users SET password_hash = 'admin' WHERE email = 'admin@dorm.ru';
UPDATE users SET password_hash = 'moderator' WHERE email = 'moderator@dorm.ru';
UPDATE users SET password_hash = 'vice' WHERE email = 'vice@dorm.ru';
UPDATE users SET password_hash = 'member' WHERE email = 'member@dorm.ru';