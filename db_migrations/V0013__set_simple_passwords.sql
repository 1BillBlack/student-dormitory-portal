-- Set simple known passwords for all test accounts
-- All passwords will be same as username (manager, admin, moderator, vice, member)

-- manager / password: manager
UPDATE users SET password_hash = '1d0258c2440a8d19e716292b231e3190' WHERE email = 'manager@dorm.ru';

-- admin / password: admin  
UPDATE users SET password_hash = '21232f297a57a5a743894a0e4a801fc3' WHERE email = 'admin@dorm.ru';

-- moderator / password: moderator
UPDATE users SET password_hash = '5033d6c975494ebd3e1c321d8b4d704a' WHERE email = 'moderator@dorm.ru';

-- vice / password: vice
UPDATE users SET password_hash = 'fbf085050c34c87de2fd8d5e3b4b6f64' WHERE email = 'vice@dorm.ru';

-- member / password: member
UPDATE users SET password_hash = 'aa08769cdcb26674c6706093503ff0a3' WHERE email = 'member@dorm.ru';