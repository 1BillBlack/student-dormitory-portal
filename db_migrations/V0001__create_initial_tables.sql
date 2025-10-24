-- Таблица пользователей
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'resident',
    room VARCHAR(50),
    room_group VARCHAR(50),
    positions TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица отработок
CREATE TABLE work_shifts (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    days INTEGER NOT NULL,
    completed_days INTEGER DEFAULT 0,
    assigned_by VARCHAR(255) NOT NULL,
    assigned_by_name VARCHAR(255) NOT NULL,
    completed_by VARCHAR(255),
    completed_by_name VARCHAR(255),
    reason TEXT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP
);

CREATE INDEX idx_work_shifts_user_id ON work_shifts(user_id);
CREATE INDEX idx_work_shifts_is_archived ON work_shifts(is_archived);

-- Таблица архива отработок
CREATE TABLE archived_work_shifts (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    days INTEGER NOT NULL,
    reason TEXT NOT NULL,
    assigned_by VARCHAR(255) NOT NULL,
    assigned_by_name VARCHAR(255) NOT NULL,
    assigned_at TIMESTAMP NOT NULL,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_archived_work_shifts_user_id ON archived_work_shifts(user_id);

-- Таблица уведомлений
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Таблица логов действий
CREATE TABLE action_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    details TEXT,
    target_user_id VARCHAR(255),
    target_user_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_action_logs_user_id ON action_logs(user_id);
CREATE INDEX idx_action_logs_target_user_id ON action_logs(target_user_id);
CREATE INDEX idx_action_logs_created_at ON action_logs(created_at DESC);
CREATE INDEX idx_action_logs_action ON action_logs(action);

-- Таблица задач студсовета
CREATE TABLE council_tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    assigned_to_users TEXT[],
    assigned_to_positions TEXT[],
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    due_date DATE NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_council_tasks_status ON council_tasks(status);
CREATE INDEX idx_council_tasks_created_by ON council_tasks(created_by);
CREATE INDEX idx_council_tasks_due_date ON council_tasks(due_date);

-- Таблица объявлений
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    author_id VARCHAR(255) NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    priority VARCHAR(50) NOT NULL DEFAULT 'normal',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_announcements_is_pinned ON announcements(is_pinned);
CREATE INDEX idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX idx_announcements_category ON announcements(category);

-- Таблица жалоб и предложений
CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    created_by VARCHAR(255) NOT NULL,
    created_by_name VARCHAR(255) NOT NULL,
    response TEXT,
    responded_by VARCHAR(255),
    responded_by_name VARCHAR(255),
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_complaints_created_by ON complaints(created_by);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_category ON complaints(category);
CREATE INDEX idx_complaints_created_at ON complaints(created_at DESC);
