-- Set simple known passwords using SHA256 (as used in code)
-- hashlib.sha256('password'.encode()).hexdigest()

-- manager / password: manager
-- SHA256('manager') = 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
UPDATE users SET password_hash = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918' WHERE email = 'manager@dorm.ru';

-- admin / password: admin
-- SHA256('admin') = 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
UPDATE users SET password_hash = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918' WHERE email = 'admin@dorm.ru';

-- moderator / password: moderator  
-- SHA256('moderator') = d9b5f58f0b38198293971865a14074f59eba3e82595becbe86ae51f1d9f1f65e
UPDATE users SET password_hash = 'd9b5f58f0b38198293971865a14074f59eba3e82595becbe86ae51f1d9f1f65e' WHERE email = 'moderator@dorm.ru';

-- vice / password: vice
-- SHA256('vice') = fbf085050c34c87de2fd8d5e3b4b6f64c1b4ed93b227aef23bf93e1485c7b5f7
UPDATE users SET password_hash = 'fbf085050c34c87de2fd8d5e3b4b6f64c1b4ed93b227aef23bf93e1485c7b5f7' WHERE email = 'vice@dorm.ru';

-- member / password: member
-- SHA256('member') = aa08769cdcb26674c6706093503ff0a3c6e20a679c8a2e046a3d2539d0b4c'
UPDATE users SET password_hash = 'aa08769cdcb26674c6706093503ff0a3c6e20a679c8a2e046a3d2539d0b4904c' WHERE email = 'member@dorm.ru';