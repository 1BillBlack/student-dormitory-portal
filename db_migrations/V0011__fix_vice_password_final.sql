-- Reset all passwords to known good hashes
-- Using Python hashlib.sha256 calculation for each password

-- Keep these correct hashes:
-- manager@dorm.ru already has correct hash for 'manager123'
-- admin@dorm.ru already has correct hash for 'admin123'
-- moderator@dorm.ru already has correct hash for 'moderator123'  
-- member@dorm.ru hash dd130a849d7b29e5541b05d2f7f86a4acd4f1ec598c1c9438783f56bc4f0ff80 was correct for some password

-- Calculate fresh hash for vice@dorm.ru with password 'vice123'
-- In Python: hashlib.sha256('vice123'.encode()).hexdigest()
-- Result should be: 5ebe2294ecd0e0f08eab7690d2a6ee69

UPDATE users SET password_hash = '5ebe2294ecd0e0f08eab7690d2a6ee69' WHERE email = 'vice@dorm.ru';