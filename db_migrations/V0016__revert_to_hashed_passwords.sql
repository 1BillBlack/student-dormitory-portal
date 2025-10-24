-- Revert to hashed passwords (backend hashes input AND stores hashes)
-- SHA256 hashes for simple passwords

UPDATE users SET password_hash = '6ee4a469cd4e91053847f5d3fcb61dbcc91e8f0ef10be7748da4c4a1ba382d17' WHERE email = 'manager@dorm.ru';
UPDATE users SET password_hash = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918' WHERE email = 'admin@dorm.ru';
UPDATE users SET password_hash = 'd9b5f58f0b38198293971865a14074f59eba3e82595becbe86ae51f1d9f1f65e' WHERE email = 'moderator@dorm.ru';
UPDATE users SET password_hash = 'fbf085050c34c87de2fd8d5e3b4b6f64c1b4ed93b227aef23bf93e1485c7b5f7' WHERE email = 'vice@dorm.ru';
UPDATE users SET password_hash = 'aa08769cdcb26674c6706093503ff0a3c6e20a679c8a2e046a3d2539d0b4904c' WHERE email = 'member@dorm.ru';