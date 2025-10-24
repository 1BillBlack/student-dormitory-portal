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
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get('DATABASE_URL')

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

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
            email = body.get('email')
            password = body.get('password')
            
            if not email or not password:
                return {'statusCode': 400, 'body': json.dumps({'error': 'Email and password required'})}
            
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
                'body': json.dumps({
                    'user': dict(user)
                }, default=str)
            }
        
        elif action == 'register':
            email = body.get('email')
            password = body.get('password')
            name = body.get('name')
            room = body.get('room')
            group = body.get('group')
            
            if not email or not password or not name:
                return {'statusCode': 400, 'body': json.dumps({'error': 'Email, password and name required'})}
            
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cur.fetchone():
                return {'statusCode': 400, 'body': json.dumps({'error': 'Email already exists'})}
            
            user_id = str(uuid.uuid4())
            password_hash = hash_password(password)
            
            cur.execute(
                "INSERT INTO users (id, email, password_hash, name, role, room, room_group, positions) VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id, email, name, role, room, room_group as group, positions",
                (user_id, email, password_hash, name, 'resident', room, group, [])
            )
            user = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'body': json.dumps({'user': dict(user)}, default=str)
            }
    
    elif method == 'PUT':
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('userId')
        
        if not user_id:
            return {'statusCode': 400, 'body': json.dumps({'error': 'User ID required'})}
        
        updates = []
        params = []
        
        if 'name' in body:
            updates.append('name = %s')
            params.append(body['name'])
        if 'room' in body:
            updates.append('room = %s')
            params.append(body['room'])
        if 'group' in body:
            updates.append('room_group = %s')
            params.append(body['group'])
        if 'role' in body:
            updates.append('role = %s')
            params.append(body['role'])
        if 'positions' in body:
            updates.append('positions = %s')
            params.append(body['positions'])
        
        if updates:
            updates.append('updated_at = CURRENT_TIMESTAMP')
            params.append(user_id)
            query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
            cur.execute(query, params)
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
        
        query = "SELECT * FROM work_shifts WHERE is_archived = FALSE"
        query_params = []
        
        if user_id:
            query += " AND user_id = %s"
            query_params.append(user_id)
        
        query += " ORDER BY assigned_at DESC"
        cur.execute(query, query_params)
        shifts = cur.fetchall()
        
        return {'statusCode': 200, 'body': json.dumps({'workShifts': [dict(s) for s in shifts]}, default=str)}
    
    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        
        cur.execute(
            """INSERT INTO work_shifts 
            (user_id, user_name, days, assigned_by, assigned_by_name, reason) 
            VALUES (%s, %s, %s, %s, %s, %s) 
            RETURNING *""",
            (body['userId'], body['userName'], body['days'], body['assignedBy'], body['assignedByName'], body['reason'])
        )
        shift = cur.fetchone()
        conn.commit()
        
        return {'statusCode': 201, 'body': json.dumps({'workShift': dict(shift)}, default=str)}
    
    elif method == 'PUT':
        body = json.loads(event.get('body', '{}'))
        shift_id = body.get('shiftId')
        action = body.get('action')
        
        if action == 'complete':
            days_to_complete = body.get('daysToComplete')
            completed_by = body.get('completedBy')
            completed_by_name = body.get('completedByName')
            
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
                
                cur.execute(
                    "UPDATE work_shifts SET is_archived = TRUE, archived_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (shift_id,)
                )
                conn.commit()
            
            return {'statusCode': 200, 'body': json.dumps({'success': True})}
    
    return {'statusCode': 405, 'body': json.dumps({'error': 'Method not allowed'})}

def handle_notifications(method: str, event: Dict[str, Any], conn, cur) -> Dict[str, Any]:
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        user_id = params.get('userId')
        
        if not user_id:
            return {'statusCode': 400, 'body': json.dumps({'error': 'User ID required'})}
        
        cur.execute(
            "SELECT * FROM notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 100",
            (user_id,)
        )
        notifications = cur.fetchall()
        
        return {'statusCode': 200, 'body': json.dumps({'notifications': [dict(n) for n in notifications]}, default=str)}
    
    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        
        cur.execute(
            """INSERT INTO notifications (user_id, type, title, message) 
            VALUES (%s, %s, %s, %s) 
            RETURNING *""",
            (body['userId'], body['type'], body['title'], body['message'])
        )
        notification = cur.fetchone()
        conn.commit()
        
        return {'statusCode': 201, 'body': json.dumps({'notification': dict(notification)}, default=str)}
    
    elif method == 'PUT':
        body = json.loads(event.get('body', '{}'))
        notification_id = body.get('notificationId')
        is_read = body.get('isRead', True)
        
        cur.execute(
            "UPDATE notifications SET is_read = %s WHERE id = %s RETURNING *",
            (is_read, notification_id)
        )
        notification = cur.fetchone()
        conn.commit()
        
        return {'statusCode': 200, 'body': json.dumps({'notification': dict(notification) if notification else None}, default=str)}
    
    return {'statusCode': 405, 'body': json.dumps({'error': 'Method not allowed'})}

def handle_logs(method: str, event: Dict[str, Any], conn, cur) -> Dict[str, Any]:
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        limit = int(params.get('limit', '100'))
        
        cur.execute(
            "SELECT * FROM action_logs ORDER BY created_at DESC LIMIT %s",
            (limit,)
        )
        logs = cur.fetchall()
        
        return {'statusCode': 200, 'body': json.dumps({'logs': [dict(l) for l in logs]}, default=str)}
    
    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        
        cur.execute(
            """INSERT INTO action_logs 
            (action, user_id, user_name, details, target_user_id, target_user_name) 
            VALUES (%s, %s, %s, %s, %s, %s) 
            RETURNING *""",
            (body['action'], body['userId'], body['userName'], body.get('details'), 
             body.get('targetUserId'), body.get('targetUserName'))
        )
        log = cur.fetchone()
        conn.commit()
        
        return {'statusCode': 201, 'body': json.dumps({'log': dict(log)}, default=str)}
    
    return {'statusCode': 405, 'body': json.dumps({'error': 'Method not allowed'})}

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    path: str = event.get('path', '/')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        resource = event.get('queryStringParameters', {}).get('resource', 'users')
        
        if resource == 'users':
            result = handle_users(method, event, conn, cur)
        elif resource == 'workShifts':
            result = handle_work_shifts(method, event, conn, cur)
        elif resource == 'notifications':
            result = handle_notifications(method, event, conn, cur)
        elif resource == 'logs':
            result = handle_logs(method, event, conn, cur)
        else:
            result = {'statusCode': 404, 'body': json.dumps({'error': 'Resource not found'})}
        
        result['headers'] = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
        result['isBase64Encoded'] = False
        
        return result
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()
