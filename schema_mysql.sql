-- Схема базы данных для портала общежития (MySQL)
-- Совместимо с MySQL 5.0+ и выше

-- Если нужно создать базу данных:
-- CREATE DATABASE dormitory_portal CHARACTER SET utf8 COLLATE utf8_general_ci;
-- USE dormitory_portal;

-- ВНИМАНИЕ: Если таблицы уже существуют, раскомментируйте следующие строки:
-- DROP TABLE IF EXISTS duty_schedule;
-- DROP TABLE IF EXISTS tasks;
-- DROP TABLE IF EXISTS announcements;
-- DROP TABLE IF EXISTS users;

-- Таблица пользователей
CREATE TABLE users (
    id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    room VARCHAR(50) DEFAULT NULL,
    room_group VARCHAR(50) DEFAULT NULL,
    positions TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT NULL,
    updated_at DATETIME DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY unique_email (email),
    KEY idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Таблица объявлений
CREATE TABLE announcements (
    id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    author_id VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_announcements_created_at (created_at),
    KEY idx_announcements_author (author_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Таблица задач
CREATE TABLE tasks (
    id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT DEFAULT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    assigned_to VARCHAR(255) DEFAULT NULL,
    due_date DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT NULL,
    updated_at DATETIME DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_tasks_status (status),
    KEY idx_tasks_assigned_to (assigned_to),
    KEY idx_tasks_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Таблица дежурств
CREATE TABLE duty_schedule (
    id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    zone VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_duty_schedule_date (date),
    KEY idx_duty_schedule_user_id (user_id),
    KEY idx_duty_schedule_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Пример создания тестового администратора
-- Пароль: admin123 (хеш SHA256)
-- Раскомментируйте и выполните после создания таблиц:
/*
INSERT INTO users (id, email, password_hash, name, role, positions) 
VALUES (
    'admin-001',
    'admin@dormitory.local',
    'f865b53623b121fd34ee5426c792e5c33af8c227b8cd9fda5d1c7f63b5e5d2e6',
    'Администратор',
    'admin',
    '[]'
);
*/