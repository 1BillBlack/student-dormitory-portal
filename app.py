"""
Портал общежития - Backend API на Flask
Единая точка входа для работы с базой данных
"""
import json
import os
import hashlib
import uuid
import re
import time
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor

app = Flask(__name__)
CORS(app)

DATABASE_URL = os.environ.get('DATABASE_URL')

# Rate limiting storage
rate_limit_storage = {}
RATE_LIMIT_REQUESTS = 100
RATE_LIMIT_WINDOW = 60

def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email)) and len(email) <= 255

def validate_uuid(value: str) -> bool:
    """Validate UUID format"""
    try:
        uuid.UUID(value)
        return True
    except (ValueError, AttributeError):
        return False

def sanitize_string(value: str, max_length: int = 500) -> str:
    """Sanitize string input"""
    if not value:
        return ""
    return str(value)[:max_length].strip()

def check_rate_limit(ip: str) -> bool:
    """Check if request is within rate limit"""
    current_time = time.time()
    
    expired_keys = [k for k, v in rate_limit_storage.items() 
                   if current_time - v['start_time'] > RATE_LIMIT_WINDOW]
    for key in expired_keys:
        del rate_limit_storage[key]
    
    if ip not in rate_limit_storage:
        rate_limit_storage[ip] = {'count': 1, 'start_time': current_time}
        return True
    
    window_data = rate_limit_storage[ip]
    
    if current_time - window_data['start_time'] > RATE_LIMIT_WINDOW:
        rate_limit_storage[ip] = {'count': 1, 'start_time': current_time}
        return True
    
    if window_data['count'] >= RATE_LIMIT_REQUESTS:
        return False
    
    window_data['count'] += 1
    return True

def get_db_connection():
    """Create database connection"""
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

# ============= USERS ENDPOINTS =============

@app.route('/api/users', methods=['GET', 'POST', 'PUT', 'OPTIONS'])
def users_handler():
    if request.method == 'OPTIONS':
        return '', 200
    
    client_ip = request.remote_addr
    if not check_rate_limit(client_ip):
        return jsonify({'error': 'Rate limit exceeded'}), 429
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if request.method == 'GET':
            cur.execute("SELECT id, email, name, role, room, room_group as group, positions FROM users ORDER BY name")
            users = cur.fetchall()
            return jsonify({'users': [dict(u) for u in users]})
        
        elif request.method == 'POST':
            data = request.get_json()
            action = data.get('action')
            
            if action == 'login':
                email = sanitize_string(data.get('email', ''), 255)
                password = data.get('password', '')
                
                if not email or not password:
                    return jsonify({'error': 'Email and password required'}), 400
                
                if not validate_email(email):
                    return jsonify({'error': 'Invalid email format'}), 400
                
                if len(password) > 32:
                    return jsonify({'error': 'Password must be 32 characters or less'}), 400
                
                password_hash = hash_password(password)
                
                cur.execute(
                    "SELECT id, email, name, role, room, room_group as group, positions FROM users WHERE email = %s AND password_hash = %s",
                    (email, password_hash)
                )
                user = cur.fetchone()
                
                if not user:
                    return jsonify({'error': 'Invalid credentials'}), 401
                
                return jsonify({'user': dict(user)})
            
            elif action == 'register':
                email = sanitize_string(data.get('email', ''), 255)
                password = data.get('password', '')
                name = sanitize_string(data.get('name', ''), 255)
                room = sanitize_string(data.get('room', ''), 50)
                group = sanitize_string(data.get('group', ''), 50)
                
                if not email or not password or not name:
                    return jsonify({'error': 'Email, password and name required'}), 400
                
                if not validate_email(email):
                    return jsonify({'error': 'Invalid email format'}), 400
                
                if len(password) < 6:
                    return jsonify({'error': 'Password must be at least 6 characters'}), 400
                
                if len(password) > 32:
                    return jsonify({'error': 'Password must be 32 characters or less'}), 400
                
                cur.execute("SELECT id FROM users WHERE email = %s", (email,))
                if cur.fetchone():
                    return jsonify({'error': 'Email already exists'}), 400
                
                user_id = str(uuid.uuid4())
                password_hash = hash_password(password)
                
                cur.execute(
                    """INSERT INTO users (id, email, password_hash, name, role, room, room_group, positions) 
                       VALUES (%s, %s, %s, %s, 'member', %s, %s, '[]'::jsonb) 
                       RETURNING id, email, name, role, room, room_group as group, positions""",
                    (user_id, email, password_hash, name, room if room else None, group if group else None)
                )
                user = cur.fetchone()
                conn.commit()
                
                return jsonify({'user': dict(user)}), 201
        
        elif request.method == 'PUT':
            data = request.get_json()
            user_id = data.get('userId', '')
            
            if not user_id or not validate_uuid(user_id):
                return jsonify({'error': 'Valid User ID required'}), 400
            
            updates = []
            params = []
            
            if 'name' in data:
                updates.append('name = %s')
                params.append(sanitize_string(data['name'], 255))
            
            if 'room' in data:
                room = sanitize_string(data['room'], 50)
                updates.append('room = %s')
                params.append(room if room else None)
            
            if 'group' in data:
                group = sanitize_string(data['group'], 50)
                updates.append('room_group = %s')
                params.append(group if group else None)
            
            if 'role' in data:
                role = data['role']
                if role not in ['manager', 'admin', 'moderator', 'member']:
                    return jsonify({'error': 'Invalid role'}), 400
                updates.append('role = %s')
                params.append(role)
            
            if 'positions' in data:
                positions = data['positions']
                if not isinstance(positions, list):
                    return jsonify({'error': 'Positions must be array'}), 400
                updates.append('positions = %s::jsonb')
                params.append(json.dumps(positions))
            
            if not updates:
                return jsonify({'error': 'No fields to update'}), 400
            
            updates.append('updated_at = CURRENT_TIMESTAMP')
            params.append(user_id)
            
            query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s RETURNING id, email, name, role, room, room_group as group, positions"
            cur.execute(query, params)
            user = cur.fetchone()
            conn.commit()
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            return jsonify({'user': dict(user)})
    
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500
    
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

# ============= ANNOUNCEMENTS ENDPOINTS =============

@app.route('/api/announcements', methods=['GET', 'POST', 'OPTIONS'])
def announcements_handler():
    if request.method == 'OPTIONS':
        return '', 200
    
    client_ip = request.remote_addr
    if not check_rate_limit(client_ip):
        return jsonify({'error': 'Rate limit exceeded'}), 429
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if request.method == 'GET':
            cur.execute("""
                SELECT a.id, a.title, a.content, a.author_id as "authorId", 
                       a.created_at as "createdAt", u.name as "authorName"
                FROM announcements a
                LEFT JOIN users u ON a.author_id = u.id
                ORDER BY a.created_at DESC
            """)
            announcements = cur.fetchall()
            return jsonify({'announcements': [dict(a) for a in announcements]})
        
        elif request.method == 'POST':
            data = request.get_json()
            title = sanitize_string(data.get('title', ''), 500)
            content = sanitize_string(data.get('content', ''), 10000)
            author_id = data.get('authorId', '')
            
            if not title or not content:
                return jsonify({'error': 'Title and content required'}), 400
            
            if not author_id or not validate_uuid(author_id):
                return jsonify({'error': 'Valid Author ID required'}), 400
            
            announcement_id = str(uuid.uuid4())
            
            cur.execute(
                """INSERT INTO announcements (id, title, content, author_id) 
                   VALUES (%s, %s, %s, %s) 
                   RETURNING id, title, content, author_id as "authorId", created_at as "createdAt" """,
                (announcement_id, title, content, author_id)
            )
            announcement = cur.fetchone()
            conn.commit()
            
            return jsonify({'announcement': dict(announcement)}), 201
    
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500
    
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

# ============= TASKS ENDPOINTS =============

@app.route('/api/tasks', methods=['GET', 'POST', 'PUT', 'OPTIONS'])
def tasks_handler():
    if request.method == 'OPTIONS':
        return '', 200
    
    client_ip = request.remote_addr
    if not check_rate_limit(client_ip):
        return jsonify({'error': 'Rate limit exceeded'}), 429
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if request.method == 'GET':
            cur.execute("""
                SELECT t.id, t.title, t.description, t.status, t.priority,
                       t.assigned_to as "assignedTo", t.due_date as "dueDate",
                       t.created_at as "createdAt", u.name as "assigneeName"
                FROM tasks t
                LEFT JOIN users u ON t.assigned_to = u.id
                ORDER BY t.created_at DESC
            """)
            tasks = cur.fetchall()
            return jsonify({'tasks': [dict(t) for t in tasks]})
        
        elif request.method == 'POST':
            data = request.get_json()
            title = sanitize_string(data.get('title', ''), 500)
            description = sanitize_string(data.get('description', ''), 10000)
            status = data.get('status', 'pending')
            priority = data.get('priority', 'medium')
            assigned_to = data.get('assignedTo')
            due_date = data.get('dueDate')
            
            if not title:
                return jsonify({'error': 'Title required'}), 400
            
            if status not in ['pending', 'in_progress', 'completed', 'cancelled']:
                return jsonify({'error': 'Invalid status'}), 400
            
            if priority not in ['low', 'medium', 'high', 'urgent']:
                return jsonify({'error': 'Invalid priority'}), 400
            
            if assigned_to and not validate_uuid(assigned_to):
                return jsonify({'error': 'Invalid Assigned To ID'}), 400
            
            task_id = str(uuid.uuid4())
            
            cur.execute(
                """INSERT INTO tasks (id, title, description, status, priority, assigned_to, due_date) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s) 
                   RETURNING id, title, description, status, priority, assigned_to as "assignedTo", 
                             due_date as "dueDate", created_at as "createdAt" """,
                (task_id, title, description if description else None, status, priority, 
                 assigned_to if assigned_to else None, due_date if due_date else None)
            )
            task = cur.fetchone()
            conn.commit()
            
            return jsonify({'task': dict(task)}), 201
        
        elif request.method == 'PUT':
            data = request.get_json()
            task_id = data.get('taskId', '')
            
            if not task_id or not validate_uuid(task_id):
                return jsonify({'error': 'Valid Task ID required'}), 400
            
            updates = []
            params = []
            
            if 'title' in data:
                updates.append('title = %s')
                params.append(sanitize_string(data['title'], 500))
            
            if 'description' in data:
                desc = sanitize_string(data['description'], 10000)
                updates.append('description = %s')
                params.append(desc if desc else None)
            
            if 'status' in data:
                status = data['status']
                if status not in ['pending', 'in_progress', 'completed', 'cancelled']:
                    return jsonify({'error': 'Invalid status'}), 400
                updates.append('status = %s')
                params.append(status)
            
            if 'priority' in data:
                priority = data['priority']
                if priority not in ['low', 'medium', 'high', 'urgent']:
                    return jsonify({'error': 'Invalid priority'}), 400
                updates.append('priority = %s')
                params.append(priority)
            
            if 'assignedTo' in data:
                assigned_to = data['assignedTo']
                if assigned_to and not validate_uuid(assigned_to):
                    return jsonify({'error': 'Invalid Assigned To ID'}), 400
                updates.append('assigned_to = %s')
                params.append(assigned_to if assigned_to else None)
            
            if 'dueDate' in data:
                updates.append('due_date = %s')
                params.append(data['dueDate'] if data['dueDate'] else None)
            
            if not updates:
                return jsonify({'error': 'No fields to update'}), 400
            
            updates.append('updated_at = CURRENT_TIMESTAMP')
            params.append(task_id)
            
            query = f"""UPDATE tasks SET {', '.join(updates)} WHERE id = %s 
                       RETURNING id, title, description, status, priority, 
                                 assigned_to as "assignedTo", due_date as "dueDate", 
                                 created_at as "createdAt" """
            cur.execute(query, params)
            task = cur.fetchone()
            conn.commit()
            
            if not task:
                return jsonify({'error': 'Task not found'}), 404
            
            return jsonify({'task': dict(task)})
    
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500
    
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

# ============= DUTY SCHEDULE ENDPOINTS =============

@app.route('/api/duty-schedule', methods=['GET', 'POST', 'PUT', 'OPTIONS'])
def duty_schedule_handler():
    if request.method == 'OPTIONS':
        return '', 200
    
    client_ip = request.remote_addr
    if not check_rate_limit(client_ip):
        return jsonify({'error': 'Rate limit exceeded'}), 429
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if request.method == 'GET':
            cur.execute("""
                SELECT d.id, d.user_id as "userId", d.date, d.zone, d.status,
                       d.created_at as "createdAt", u.name as "userName"
                FROM duty_schedule d
                LEFT JOIN users u ON d.user_id = u.id
                ORDER BY d.date DESC
            """)
            duties = cur.fetchall()
            return jsonify({'duties': [dict(d) for d in duties]})
        
        elif request.method == 'POST':
            data = request.get_json()
            user_id = data.get('userId', '')
            date = data.get('date')
            zone = sanitize_string(data.get('zone', ''), 100)
            
            if not user_id or not validate_uuid(user_id):
                return jsonify({'error': 'Valid User ID required'}), 400
            
            if not date or not zone:
                return jsonify({'error': 'Date and zone required'}), 400
            
            duty_id = str(uuid.uuid4())
            
            cur.execute(
                """INSERT INTO duty_schedule (id, user_id, date, zone, status) 
                   VALUES (%s, %s, %s, %s, 'pending') 
                   RETURNING id, user_id as "userId", date, zone, status, created_at as "createdAt" """,
                (duty_id, user_id, date, zone)
            )
            duty = cur.fetchone()
            conn.commit()
            
            return jsonify({'duty': dict(duty)}), 201
        
        elif request.method == 'PUT':
            data = request.get_json()
            duty_id = data.get('dutyId', '')
            status = data.get('status', '')
            
            if not duty_id or not validate_uuid(duty_id):
                return jsonify({'error': 'Valid Duty ID required'}), 400
            
            if status not in ['pending', 'completed', 'missed']:
                return jsonify({'error': 'Invalid status'}), 400
            
            cur.execute(
                """UPDATE duty_schedule SET status = %s WHERE id = %s 
                   RETURNING id, user_id as "userId", date, zone, status, created_at as "createdAt" """,
                (status, duty_id)
            )
            duty = cur.fetchone()
            conn.commit()
            
            if not duty:
                return jsonify({'error': 'Duty not found'}), 404
            
            return jsonify({'duty': dict(duty)})
    
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500
    
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

# ============= HEALTH CHECK =============

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'API is running'})

if __name__ == '__main__':
    app.run(debug=True)
