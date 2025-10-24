"""
Business: Единая API для работы с базой данных портала общежития
Args: event - dict с httpMethod, body, queryStringParameters, pathParams
      context - объект с атрибутами request_id, function_name
Returns: HTTP response dict
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

def get_client_ip(event: Dict[str, Any]) -> str:
    """Extract client IP from event"""
    request_context = event.get('requestContext', {})
    identity = request_context.get('identity', {})
    return identity.get('sourceIp', 'unknown')

def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    return conn

def handle_users(method: str, event: Dict[str, Any], conn, cur) -> Dict[str, Any]:
    if method == 'GET':
        cur.execute("SELECT id, email, name, role, room, room_group as group, positions FROM users ORDER BY name")
        users = cur.fetchall()
        
        return {
            'statusCode': 200,
            'body': json.dumps({'users': [dict(u) for u in users]}, default=str)
        }
    
    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
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
        body = json.loads(event.get('body', '{}'))
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
            positions_json = json.dumps(positions)
            updates.append('positions = %s::jsonb')
            params.append(positions_json)
        
        if updates:
            updates.append('updated_at = CURRENT_TIMESTAMP')
            params.append(user_id)
            query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
            cur.execute(query, params)
            conn.commit()
        
        return {'statusCode': 200, 'body': json.dumps({'success': True})}
    
    elif method == 'DELETE':
        params = event.get('queryStringParameters', {})
        user_id = params.get('userId', '')
        
        if not user_id or not validate_uuid(user_id):
            return {'statusCode': 400, 'body': json.dumps({'error': 'Valid User ID required'})}
        
        cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()
        
        return {'statusCode': 200, 'body': json.dumps({'success': True})}
    
    return {'statusCode': 405, 'body': json.dumps({'error': 'Method not allowed'})}

def handle_work_shifts(method: str, event: Dict[str, Any], conn, cur) -> Dict[str, Any]:
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        user_id = params.get('userId')
        include_archived = params.get('archived') == 'true'
        
        if include_archived:
            cur.execute("SELECT * FROM archived_work_shifts ORDER BY archived_at DESC")
            shifts = cur.fetchall()
            return {'statusCode': 200, 'body': json.dumps({'archivedShifts': [dict(s) for s in shifts]}, default=str)}
        
        if user_id:
            if not validate_uuid(user_id):
                return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid user ID'})}
            cur.execute("SELECT * FROM work_shifts WHERE is_archived = FALSE AND user_id = %s ORDER BY assigned_at DESC", (user_id,))
        else:
            cur.execute("SELECT * FROM work_shifts WHERE is_archived = FALSE ORDER BY assigned_at DESC")
        
        shifts = cur.fetchall()
        return {'statusCode': 200, 'body': json.dumps({'workShifts': [dict(s) for s in shifts]}, default=str)}
    
    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        
        user_id = body.get('userId', '')
        if not validate_uuid(user_id):
            return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid user ID'})}
        
        user_name = sanitize_string(body.get('userName', ''), 255)
        days = body.get('days')
        assigned_by = body.get('assignedBy', '')
        assigned_by_name = sanitize_string(body.get('assignedByName', ''), 255)
        reason = sanitize_string(body.get('reason', ''), 500)
        
        if not isinstance(days, int) or days <= 0 or days > 365:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid days value'})}
        
        if not validate_uuid(assigned_by):
            return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid assigned_by ID'})}
        
        cur.execute(
            """INSERT INTO work_shifts (user_id, user_name, days, assigned_by, assigned_by_name, reason) 
               VALUES (%s, %s, %s, %s, %s, %s) RETURNING *""",
            (user_id, user_name, days, assigned_by, assigned_by_name, reason)
        )
        shift = cur.fetchone()
        conn.commit()
        
        return {'statusCode': 201, 'body': json.dumps({'workShift': dict(shift)}, default=str)}
    
    elif method == 'PUT':
        body = json.loads(event.get('body', '{}'))
        shift_id = body.get('shiftId')
        action = body.get('action')
        
        if not isinstance(shift_id, int):
            return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid shift ID'})}
        
        if action == 'complete':
            days_to_complete = body.get('daysToComplete')
            completed_by = body.get('completedBy', '')
            completed_by_name = sanitize_string(body.get('completedByName', ''), 255)
            
            if not isinstance(days_to_complete, int) or days_to_complete <= 0:
                return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid days value'})}
            
            if not validate_uuid(completed_by):
                return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid completed_by ID'})}
            
            cur.execute(
                """UPDATE work_shifts 
                   SET completed_days = completed_days + %s, 
                       completed_by = %s, 
                       completed_by_name = %s, 
                       completed_at = CURRENT_TIMESTAMP 
                   WHERE id = %s
                   RETURNING *""",
                (days_to_complete, completed_by, completed_by_name, shift_id)
            )
            shift = cur.fetchone()
            conn.commit()
            
            return {'statusCode': 200, 'body': json.dumps({'workShift': dict(shift)}, default=str)}
        
        elif action == 'archive':
            cur.execute("SELECT * FROM work_shifts WHERE id = %s", (shift_id,))
            shift = cur.fetchone()
            
            if shift:
                cur.execute(
                    """INSERT INTO archived_work_shifts 
                       (user_id, user_name, days, reason, assigned_by, assigned_by_name, assigned_at) 
                       VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                    (shift['user_id'], shift['user_name'], shift['days'], shift['reason'],
                     shift['assigned_by'], shift['assigned_by_name'], shift['assigned_at'])
                )
                
                cur.execute("UPDATE work_shifts SET is_archived = TRUE WHERE id = %s", (shift_id,))
                conn.commit()
            
            return {'statusCode': 200, 'body': json.dumps({'success': True})}
    
    return {'statusCode': 405, 'body': json.dumps({'error': 'Method not allowed'})}

def handle_notifications(method: str, event: Dict[str, Any], conn, cur) -> Dict[str, Any]:
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        user_id = params.get('userId', '')
        
        if not validate_uuid(user_id):
            return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid user ID'})}
        
        cur.execute(
            "SELECT * FROM notifications WHERE user_id = %s ORDER BY created_at DESC",
            (user_id,)
        )
        notifications = cur.fetchall()
        
        return {'statusCode': 200, 'body': json.dumps({'notifications': [dict(n) for n in notifications]}, default=str)}
    
    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        
        user_id = body.get('userId', '')
        if not validate_uuid(user_id):
            return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid user ID'})}
        
        notif_type = sanitize_string(body.get('type', ''), 50)
        title = sanitize_string(body.get('title', ''), 255)
        message = sanitize_string(body.get('message', ''), 1000)
        
        cur.execute(
            """INSERT INTO notifications (user_id, type, title, message) 
               VALUES (%s, %s, %s, %s) RETURNING *""",
            (user_id, notif_type, title, message)
        )
        notification = cur.fetchone()
        conn.commit()
        
        return {'statusCode': 201, 'body': json.dumps({'notification': dict(notification)}, default=str)}
    
    elif method == 'PUT':
        body = json.loads(event.get('body', '{}'))
        notification_id = body.get('notificationId')
        is_read = body.get('isRead', False)
        
        if not isinstance(notification_id, int):
            return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid notification ID'})}
        
        cur.execute(
            "UPDATE notifications SET is_read = %s WHERE id = %s RETURNING *",
            (is_read, notification_id)
        )
        notification = cur.fetchone()
        conn.commit()
        
        return {'statusCode': 200, 'body': json.dumps({'notification': dict(notification)}, default=str)}
    
    return {'statusCode': 405, 'body': json.dumps({'error': 'Method not allowed'})}

def handle_logs(method: str, event: Dict[str, Any], conn, cur) -> Dict[str, Any]:
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        limit = params.get('limit', '100')
        
        try:
            limit = int(limit)
            if limit <= 0 or limit > 1000:
                limit = 100
        except ValueError:
            limit = 100
        
        cur.execute("SELECT * FROM logs ORDER BY created_at DESC LIMIT %s", (limit,))
        logs = cur.fetchall()
        
        return {'statusCode': 200, 'body': json.dumps({'logs': [dict(l) for l in logs]}, default=str)}
    
    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        
        action = sanitize_string(body.get('action', ''), 100)
        user_id = body.get('userId', '')
        user_name = sanitize_string(body.get('userName', ''), 255)
        details = sanitize_string(body.get('details', ''), 1000)
        
        if not validate_uuid(user_id):
            return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid user ID'})}
        
        cur.execute(
            """INSERT INTO logs (action, user_id, user_name, details) 
               VALUES (%s, %s, %s, %s) RETURNING *""",
            (action, user_id, user_name, details)
        )
        log = cur.fetchone()
        conn.commit()
        
        return {'statusCode': 201, 'body': json.dumps({'log': dict(log)}, default=str)}
    
    elif method == 'DELETE':
        cur.execute("DELETE FROM logs")
        conn.commit()
        return {'statusCode': 200, 'body': json.dumps({'success': True})}
    
    return {'statusCode': 405, 'body': json.dumps({'error': 'Method not allowed'})}

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    resource = event.get('queryStringParameters', {}).get('resource', '')
    
    # Rate limiting check
    client_ip = get_client_ip(event)
    if not check_rate_limit(client_ip):
        return {
            'statusCode': 429,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Too many requests. Please try again later.'}),
            'isBase64Encoded': False
        }
    
    # Handle CORS OPTIONS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if resource == 'users':
            result = handle_users(method, event, conn, cur)
        elif resource == 'work-shifts':
            result = handle_work_shifts(method, event, conn, cur)
        elif resource == 'notifications':
            result = handle_notifications(method, event, conn, cur)
        elif resource == 'logs':
            result = handle_logs(method, event, conn, cur)
        else:
            result = {'statusCode': 404, 'body': json.dumps({'error': 'Resource not found'})}
        
        cur.close()
        
        if 'headers' not in result:
            result['headers'] = {}
        result['headers']['Access-Control-Allow-Origin'] = '*'
        result['headers']['Content-Type'] = 'application/json'
        result['headers']['X-Content-Type-Options'] = 'nosniff'
        result['headers']['X-Frame-Options'] = 'DENY'
        result['headers']['X-XSS-Protection'] = '1; mode=block'
        result['isBase64Encoded'] = False
        
        return result
        
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': 'Invalid JSON in request body'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        if conn:
            try:
                conn.rollback()
            except:
                pass
        
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': 'Internal server error'}),
            'isBase64Encoded': False
        }
    finally:
        if conn:
            try:
                conn.close()
            except:
                pass