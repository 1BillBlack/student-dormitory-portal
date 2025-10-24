-- Set same password 'admin' for all test users for simplicity
-- SHA256('admin') = 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918

UPDATE users SET password_hash = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918' 
WHERE email IN ('manager@dorm.ru', 'admin@dorm.ru', 'moderator@dorm.ru', 'vice@dorm.ru', 'member@dorm.ru');