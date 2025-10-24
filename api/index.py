"""
Vercel Serverless Function для работы с базой данных портала общежития
"""
import json
import os
import hashlib
import uuid
import re
import time
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get('DATABASE_URL')

# Rate limiting storage (in-memory, per function instance)
rate_limit_storage = {}
RATE_LIMIT_REQUESTS = 100  # requests
RATE_LIMIT_WINDOW = 60  # seconds

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

def snake_to_camel(snake_str: str) -> str:
    """Convert snake_case to camelCase"""
    components = snake_str.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])

def convert_dict_keys_to_camel(data: Dict[str, Any]) -> Dict[str, Any]:
    """Convert all dictionary keys from snake_case to camelCase"""
    return {snake_to_camel(key): value for key, value in data.items()}

def check_rate_limit(ip: str) -> bool:
    """Check if request is within rate limit"""
    current_time = time.time()
    
    # Clean old entries
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

def get_client_ip(request) -> str:
    """Extract client IP from Vercel request"""
    return request.headers.get('x-real-ip', request.headers.get('x-forwarded-for', 'unknown').split(',')[0])

def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    return conn

def handle_users(method: str, body: Dict[str, Any], conn, cur) -> Dict[str, Any]:
    if method == 'GET':
        cur.execute("SELECT id, email, name, role, room, room_group as group, positions FROM users ORDER BY name")
        users = cur.fetchall()
        
        return {
            'statusCode': 200,
            'body': json.dumps({'users': [dict(u) for u in users]}, default=str)
        }
    
    elif method == 'POST':
        action = body.get('action')
        
        if action == 'login':
            email = sanitize_string(body.get('email', ''), 255)
            password = body.get('password', '')
            
            if not email or not password:
                return {'statusCode': 400, 'body': json.dumps({'error': 'Email and password required'})}
            
            if not validate_email(email):
                return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid email format'})}
            
            if len(password) > 32:
                return {'statusCode': 400, 'body': json.dumps({'error': 'Password must be 32 characters or less'})}
            
            password_hash = hash_password(password)
            
            cur.execute(
                "SELECT id, email, name, role, room, room_group as group, positions FROM users WHERE email = %s AND password_hash = %s",
                (email, password_hash)
            )
            user = cur.fetchone()
            
            if not user:
                return {'statusCode': 401, 'body': json.dumps({'error': 'Invalid credentials'})}
            
            return {
                'statusCode': 200,
                'body': json.dumps({'user': dict(user)}, default=str)
            }
        
        elif action == 'register':
            email = sanitize_string(body.get('email', ''), 255)
            password = body.get('password', '')
            name = sanitize_string(body.get('name', ''), 255)
            room = sanitize_string(body.get('room', ''), 50)
            group = sanitize_string(body.get('group', ''), 50)
            
            if not email or not password or not name:
                return {'statusCode': 400, 'body': json.dumps({'error': 'Email, password and name required'})}
            
            if not validate_email(email):
                return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid email format'})}
            
            if len(password) < 6:
                return {'statusCode': 400, 'body': json.dumps({'error': 'Password must be at least 6 characters'})}
            
            if len(password) > 32:
                return {'statusCode': 400, 'body': json.dumps({'error': 'Password must be 32 characters or less'})}
            
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cur.fetchone():
                return {'statusCode': 400, 'body': json.dumps({'error': 'Email already exists'})}
            
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
            
            return {
                'statusCode': 201,
                'body': json.dumps({'user': dict(user)}, default=str)
            }
    
    elif method == 'PUT':
        user_id = body.get('userId', '')
        
        if not user_id or not validate_uuid(user_id):
            return {'statusCode': 400, 'body': json.dumps({'error': 'Valid User ID required'})}
        
        updates = []
        params = []
        
        if 'name' in body:
            name = sanitize_string(body['name'], 255)
            updates.append('name = %s')
            params.append(name)
        
        if 'room' in body:
            room = sanitize_string(body['room'], 50)
            updates.append('room = %s')
            params.append(room if room else None)
        
        if 'group' in body:
            group = sanitize_string(body['group'], 50)
            updates.append('room_group = %s')
            params.append(group if group else None)
        
        if 'role' in body:
            role = body['role']
            if role not in ['manager', 'admin', 'moderator', 'member']:
                return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid role'})}
            updates.append('role = %s')
            params.append(role)
        
        if 'positions' in body:
            positions = body['positions']
            if not isinstance(positions, list):
                return {'statusCode': 400, 'body': json.dumps({'error': 'Positions must be array'})}
            updates.append('positions = %s::jsonb')
            params.append(json.dumps(positions))
        
        if not updates:
            return {'statusCode': 400, 'body': json.dumps({'error': 'No fields to update'})}
        
        params.append(user_id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s RETURNING id, email, name, role, room, room_group as group, positions"
        
        cur.execute(query, params)
        user = cur.fetchone()
        
        if not user:
            return {'statusCode': 404, 'body': json.dumps({'error': 'User not found'})}
        
        conn.commit()
        
        return {
            'statusCode': 200,
            'body': json.dumps({'user': dict(user)}, default=str)
        }

def handle_announcements(method: str, body: Dict[str, Any], conn, cur) -> Dict[str, Any]:
    if method == 'GET':
        cur.execute("SELECT id, title, content, author_id, created_at FROM announcements ORDER BY created_at DESC")
        announcements = cur.fetchall()
        
        return {
            'statusCode': 200,
            'body': json.dumps({'announcements': [convert_dict_keys_to_camel(dict(a)) for a in announcements]}, default=str)
        }
    
    elif method == 'POST':
        title = sanitize_string(body.get('title', ''), 500)
        content = sanitize_string(body.get('content', ''), 5000)
        author_id = body.get('authorId', '')
        
        if not title or not content or not author_id:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Title, content and author ID required'})}
        
        if not validate_uuid(author_id):
            return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid author ID'})}
        
        announcement_id = str(uuid.uuid4())
        
        cur.execute(
            """INSERT INTO announcements (id, title, content, author_id) 
               VALUES (%s, %s, %s, %s) 
               RETURNING id, title, content, author_id, created_at""",
            (announcement_id, title, content, author_id)
        )
        announcement = cur.fetchone()
        conn.commit()
        
        return {
            'statusCode': 201,
            'body': json.dumps({'announcement': convert_dict_keys_to_camel(dict(announcement))}, default=str)
        }

def handle_tasks(method: str, body: Dict[str, Any], conn, cur) -> Dict[str, Any]:
    if method == 'GET':
        cur.execute("""
            SELECT id, title, description, status, priority, assigned_to, due_date, created_at, updated_at 
            FROM tasks 
            ORDER BY created_at DESC
        """)
        tasks = cur.fetchall()
        
        return {
            'statusCode': 200,
            'body': json.dumps({'tasks': [convert_dict_keys_to_camel(dict(t)) for t in tasks]}, default=str)
        }
    
    elif method == 'POST':
        title = sanitize_string(body.get('title', ''), 500)
        description = sanitize_string(body.get('description', ''), 2000)
        assigned_to = body.get('assignedTo', '')
        priority = body.get('priority', 'medium')
        due_date_str = body.get('dueDate')
        
        if not title:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Title required'})}
        
        if assigned_to and not validate_uuid(assigned_to):
            return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid assigned_to ID'})}
        
        if priority not in ['low', 'medium', 'high', 'urgent']:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid priority'})}
        
        due_date = None
        if due_date_str:
            try:
                due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
            except ValueError:
                return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid due date format'})}
        
        task_id = str(uuid.uuid4())
        
        cur.execute(
            """INSERT INTO tasks (id, title, description, status, priority, assigned_to, due_date) 
               VALUES (%s, %s, %s, 'pending', %s, %s, %s) 
               RETURNING id, title, description, status, priority, assigned_to, due_date, created_at, updated_at""",
            (task_id, title, description if description else None, priority, assigned_to if assigned_to else None, due_date)
        )
        task = cur.fetchone()
        conn.commit()
        
        return {
            'statusCode': 201,
            'body': json.dumps({'task': convert_dict_keys_to_camel(dict(task))}, default=str)
        }
    
    elif method == 'PUT':
        task_id = body.get('taskId', '')
        
        if not task_id or not validate_uuid(task_id):
            return {'statusCode': 400, 'body': json.dumps({'error': 'Valid Task ID required'})}
        
        updates = []
        params = []
        
        if 'title' in body:
            title = sanitize_string(body['title'], 500)
            updates.append('title = %s')
            params.append(title)
        
        if 'description' in body:
            description = sanitize_string(body['description'], 2000)
            updates.append('description = %s')
            params.append(description if description else None)
        
        if 'status' in body:
            status = body['status']
            if status not in ['pending', 'in_progress', 'completed', 'cancelled']:
                return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid status'})}
            updates.append('status = %s')
            params.append(status)
        
        if 'priority' in body:
            priority = body['priority']
            if priority not in ['low', 'medium', 'high', 'urgent']:
                return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid priority'})}
            updates.append('priority = %s')
            params.append(priority)
        
        if 'assignedTo' in body:
            assigned_to = body['assignedTo']
            if assigned_to and not validate_uuid(assigned_to):
                return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid assigned_to ID'})}
            updates.append('assigned_to = %s')
            params.append(assigned_to if assigned_to else None)
        
        if 'dueDate' in body:
            due_date_str = body['dueDate']
            due_date = None
            if due_date_str:
                try:
                    due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
                except ValueError:
                    return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid due date format'})}
            updates.append('due_date = %s')
            params.append(due_date)
        
        if not updates:
            return {'statusCode': 400, 'body': json.dumps({'error': 'No fields to update'})}
        
        updates.append('updated_at = NOW()')
        params.append(task_id)
        
        query = f"UPDATE tasks SET {', '.join(updates)} WHERE id = %s RETURNING id, title, description, status, priority, assigned_to, due_date, created_at, updated_at"
        
        cur.execute(query, params)
        task = cur.fetchone()
        
        if not task:
            return {'statusCode': 404, 'body': json.dumps({'error': 'Task not found'})}
        
        conn.commit()
        
        return {
            'statusCode': 200,
            'body': json.dumps({'task': convert_dict_keys_to_camel(dict(task))}, default=str)
        }

def handle_duty_schedule(method: str, body: Dict[str, Any], conn, cur) -> Dict[str, Any]:
    if method == 'GET':
        cur.execute("""
            SELECT id, user_id, date, zone, status, created_at 
            FROM duty_schedule 
            ORDER BY date DESC, zone
        """)
        duties = cur.fetchall()
        
        return {
            'statusCode': 200,
            'body': json.dumps({'duties': [convert_dict_keys_to_camel(dict(d)) for d in duties]}, default=str)
        }
    
    elif method == 'POST':
        user_id = body.get('userId', '')
        date_str = body.get('date', '')
        zone = sanitize_string(body.get('zone', ''), 100)
        
        if not user_id or not date_str or not zone:
            return {'statusCode': 400, 'body': json.dumps({'error': 'User ID, date and zone required'})}
        
        if not validate_uuid(user_id):
            return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid user ID'})}
        
        try:
            duty_date = datetime.fromisoformat(date_str.replace('Z', '+00:00')).date()
        except ValueError:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid date format'})}
        
        duty_id = str(uuid.uuid4())
        
        cur.execute(
            """INSERT INTO duty_schedule (id, user_id, date, zone, status) 
               VALUES (%s, %s, %s, %s, 'pending') 
               RETURNING id, user_id, date, zone, status, created_at""",
            (duty_id, user_id, duty_date, zone)
        )
        duty = cur.fetchone()
        conn.commit()
        
        return {
            'statusCode': 201,
            'body': json.dumps({'duty': convert_dict_keys_to_camel(dict(duty))}, default=str)
        }
    
    elif method == 'PUT':
        duty_id = body.get('dutyId', '')
        
        if not duty_id or not validate_uuid(duty_id):
            return {'statusCode': 400, 'body': json.dumps({'error': 'Valid Duty ID required'})}
        
        status = body.get('status')
        if not status or status not in ['pending', 'completed', 'missed']:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Valid status required'})}
        
        cur.execute(
            """UPDATE duty_schedule SET status = %s 
               WHERE id = %s 
               RETURNING id, user_id, date, zone, status, created_at""",
            (status, duty_id)
        )
        duty = cur.fetchone()
        
        if not duty:
            return {'statusCode': 404, 'body': json.dumps({'error': 'Duty not found'})}
        
        conn.commit()
        
        return {
            'statusCode': 200,
            'body': json.dumps({'duty': convert_dict_keys_to_camel(dict(duty))}, default=str)
        }

def handler(request):
    """Vercel handler function"""
    try:
        client_ip = get_client_ip(request)
        
        if not check_rate_limit(client_ip):
            return {
                'statusCode': 429,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Rate limit exceeded'})
            }
        
        method = request.method
        
        if method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                    'Access-Control-Max-Age': '86400'
                },
                'body': ''
            }
        
        path = request.path
        body = request.get_json() if request.method in ['POST', 'PUT'] else {}
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            if path.startswith('/users'):
                result = handle_users(method, body, conn, cur)
            elif path.startswith('/announcements'):
                result = handle_announcements(method, body, conn, cur)
            elif path.startswith('/tasks'):
                result = handle_tasks(method, body, conn, cur)
            elif path.startswith('/duty-schedule'):
                result = handle_duty_schedule(method, body, conn, cur)
            else:
                result = {
                    'statusCode': 404,
                    'body': json.dumps({'error': 'Endpoint not found'})
                }
            
            result['headers'] = {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
            
            return result
            
        finally:
            cur.close()
            conn.close()
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }
