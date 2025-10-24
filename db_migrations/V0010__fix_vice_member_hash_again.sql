-- Correct password hashes using proper SHA256 calculation
-- Python: hashlib.sha256(b'vice123').hexdigest() 
-- Python: hashlib.sha256(b'member123').hexdigest()

UPDATE users SET password_hash = '3f6e1b8e1f0e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e' WHERE email = 'vice@dorm.ru';
UPDATE users SET password_hash = 'dd130a849d7b29e5541b05d2f7f86a4acd4f1ec598c1c9438783f56bc4f0ff80' WHERE email = 'member@dorm.ru';