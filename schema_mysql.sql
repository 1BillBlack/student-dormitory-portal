-- Схема базы данных для портала общежития (MySQL)
-- Используйте этот файл если на хостинге только MySQL

-- Создание базы данных (если нужно)
-- CREATE DATABASE IF NOT EXISTS dormitory_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE dormitory_portal;

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    room VARCHAR(50),
    room_group VARCHAR(50),
    positions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица объявлений
CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    author_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_announcements_created_at (created_at DESC),
    INDEX idx_announcements_author (author_id),
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица задач
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    assigned_to VARCHAR(255),
    due_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tasks_status (status),
    INDEX idx_tasks_assigned_to (assigned_to),
    INDEX idx_tasks_due_date (due_date),
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица дежурств
CREATE TABLE IF NOT EXISTS duty_schedule (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    zone VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_duty_schedule_date (date),
    INDEX idx_duty_schedule_user_id (user_id),
    INDEX idx_duty_schedule_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Пример создания тестового администратора
-- Пароль: admin123
-- INSERT INTO users (id, email, password_hash, name, role, positions) 
-- VALUES (
--     UUID(),
--     'admin@dormitory.local',
--     'f865b53623b121fd34ee5426c792e5c33af8c227b8cd9fda5d1c7f63b5e5d2e6',
--     'Администратор',
--     'admin',
--     '[]'
-- );
