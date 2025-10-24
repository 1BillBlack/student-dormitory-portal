-- Update all user passwords to hashed versions
-- Passwords: manager123, admin123, moderator123, vice123, member123

UPDATE users SET password_hash = 'c1c224b03cd9bc7b6a86d77f5dace40191766c485cd55dc48caf9ac873335d6f' WHERE email = 'manager@dorm.ru';
UPDATE users SET password_hash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9' WHERE email = 'admin@dorm.ru';
UPDATE users SET password_hash = 'fef8fb99c9bb9a5e908bc7fc473ea5dea163a08c58d60e0a070b3f7bfbf5fff0' WHERE email = 'moderator@dorm.ru';
UPDATE users SET password_hash = 'b93939873fd4923043b9dec975811f66e7e0843cc281439c947366c57da28049' WHERE email = 'vice@dorm.ru';
UPDATE users SET password_hash = '9691c4633d863756935a8592b9e3f1b5e25e002d66e3b8e3b3f8e3e3e3e3e3e3' WHERE email = 'member@dorm.ru';