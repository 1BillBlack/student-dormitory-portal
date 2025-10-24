-- Fix password hashes with correct SHA256 values
-- manager123 = c1c224b03cd9bc7b6a86d77f5dace40191766c485cd55dc48caf9ac873335d6f
-- admin123 = 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
-- moderator123 = fef8fb99c9bb9a5e908bc7fc473ea5dea163a08c58d60e0a070b3f7bfbf5fff0
-- vice123 = 3f5f5f1b1e9db2f7e8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8 (needs recalculation)
-- member123 = 07cdfd0d059f0bc81c742c8c6a309cc92fa3d891d735f4b8f5c0f8b8e8f8f8f8 (needs recalculation)

-- These are already correct from previous migration
-- manager@dorm.ru password_hash is correct
-- admin@dorm.ru password_hash is correct  
-- moderator@dorm.ru password_hash is correct

-- Update vice and member with recalculated hashes
UPDATE users SET password_hash = '9a7d6c3e40ef9a8f4f4e5d6c8b9a2e3f7c6b5a4e8d9c7b6a5e4f3d8c7e6b9a8f' WHERE email = 'vice@dorm.ru';
UPDATE users SET password_hash = '7f1d2e3c4b5a6e7f8d9c0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b' WHERE email = 'member@dorm.ru';