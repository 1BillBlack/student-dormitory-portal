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

def escape_sql_string(value: str) -> str:
    if value is None:
        return 'NULL'
    escaped = str(value).replace("'", "''")
    return f"'{escaped}'"

def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
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
            email = body.get('email')
            password = body.get('password')
            
            if not email or not password:
                return {'statusCode': 400, 'body': json.dumps({'error': 'Email and password required'})}
            
            password_hash = hash_password(password)
            
            # Debug: проверяем что в БД
            check_query = f"SELECT email, password_hash FROM users WHERE email = {escape_sql_string(email)}"
            cur.execute(check_query)
            db_user = cur.fetchone()
            
            query = f"SELECT id, email, name, role, room, room_group as group, positions FROM users WHERE email = {escape_sql_string(email)} AND password_hash = {escape_sql_string(password_hash)}"
            cur.execute(query)
            user = cur.fetchone()
            
            if not user:
                return {'statusCode': 401, 'body': json.dumps({
                    'error': 'Invalid credentials',
                    'debug': {
                        'email': email,
                        'password': password,
                        'computed_hash': password_hash,
                        'db_hash': dict(db_user)['password_hash'] if db_user else None,
                        'match': dict(db_user)['password_hash'] == password_hash if db_user else False
                    }
                })}
            
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
            
            cur.execute(f"SELECT id FROM users WHERE email = {escape_sql_string(email)}")
            if cur.fetchone():
                return {'statusCode': 400, 'body': json.dumps({'error': 'Email already exists'})}
            
            user_id = str(uuid.uuid4())
            password_hash = hash_password(password)
            
            query = f"""INSERT INTO users (id, email, password_hash, name, role, room, room_group, positions) 
                       VALUES ({escape_sql_string(user_id)}, {escape_sql_string(email)}, {escape_sql_string(password_hash)}, 
                               {escape_sql_string(name)}, 'member', {escape_sql_string(room)}, {escape_sql_string(group)}, '[]'::jsonb) 
                       RETURNING id, email, name, role, room, room_group as group, positions"""
            cur.execute(query)
            user = cur.fetchone()
            
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
        
        if 'name' in body:
            updates.append(f'name = {escape_sql_string(body["name"])}')
        if 'room' in body:
            updates.append(f'room = {escape_sql_string(body["room"])}')
        if 'group' in body:
            updates.append(f'room_group = {escape_sql_string(body["group"])}')
        if 'role' in body:
            updates.append(f'role = {escape_sql_string(body["role"])}')
        if 'positions' in body:
            positions_json = json.dumps(body['positions'])
            updates.append(f"positions = '{positions_json}'::jsonb")
        
        if updates:
            updates.append('updated_at = CURRENT_TIMESTAMP')
            query = f"UPDATE users SET {', '.join(updates)} WHERE id = {escape_sql_string(user_id)}"
            cur.execute(query)
        
        return {'statusCode': 200, 'body': json.dumps({'success': True})}
    
    elif method == 'DELETE':
        params = event.get('queryStringParameters', {})
        user_id = params.get('userId')
        
        if not user_id:
            return {'statusCode': 400, 'body': json.dumps({'error': 'User ID required'})}
        
        query = f"DELETE FROM users WHERE id = {escape_sql_string(user_id)}"
        cur.execute(query)
        
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
        
        if user_id:
            query += f" AND user_id = {escape_sql_string(user_id)}"
        
        query += " ORDER BY assigned_at DESC"
        cur.execute(query)
        shifts = cur.fetchall()
        
        return {'statusCode': 200, 'body': json.dumps({'workShifts': [dict(s) for s in shifts]}, default=str)}
    
    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        
        query = f"""INSERT INTO work_shifts 
            (user_id, user_name, days, assigned_by, assigned_by_name, reason) 
            VALUES ({escape_sql_string(body['userId'])}, {escape_sql_string(body['userName'])}, 
                    {body['days']}, {escape_sql_string(body['assignedBy'])}, 
                    {escape_sql_string(body['assignedByName'])}, {escape_sql_string(body['reason'])}) 
            RETURNING *"""
        cur.execute(query)
        shift = cur.fetchone()
        
        return {'statusCode': 201, 'body': json.dumps({'workShift': dict(shift)}, default=str)}
    
    elif method == 'PUT':
        body = json.loads(event.get('body', '{}'))
        shift_id = body.get('shiftId')
        action = body.get('action')
        
        if action == 'complete':
            days_to_complete = body.get('daysToComplete')
            completed_by = body.get('completedBy')
            completed_by_name = body.get('completedByName')
            
            query = f"""UPDATE work_shifts 
                SET completed_days = completed_days + {days_to_complete}, 
                    completed_by = {escape_sql_string(completed_by)}, 
                    completed_by_name = {escape_sql_string(completed_by_name)}, 
                    completed_at = CURRENT_TIMESTAMP 
                WHERE id = {escape_sql_string(shift_id)}
                RETURNING *"""
            cur.execute(query)
            shift = cur.fetchone()
            
            return {'statusCode': 200, 'body': json.dumps({'workShift': dict(shift)}, default=str)}
        
        elif action == 'archive':
            cur.execute(f"SELECT * FROM work_shifts WHERE id = {escape_sql_string(shift_id)}")
            shift = cur.fetchone()
            
            if shift:
                query = f"""INSERT INTO archived_work_shifts 
                    (user_id, user_name, days, reason, assigned_by, assigned_by_name, assigned_at) 
                    VALUES ({escape_sql_string(shift['user_id'])}, {escape_sql_string(shift['user_name'])}, 
                            {shift['days']}, {escape_sql_string(shift['reason'])}, 
                            {escape_sql_string(shift['assigned_by'])}, {escape_sql_string(shift['assigned_by_name'])}, 
                            {escape_sql_string(str(shift['assigned_at']))})"""
                cur.execute(query)
                
                cur.execute(f"UPDATE work_shifts SET is_archived = TRUE, archived_at = CURRENT_TIMESTAMP WHERE id = {escape_sql_string(shift_id)}")
            
            return {'statusCode': 200, 'body': json.dumps({'success': True})}
    
    return {'statusCode': 405, 'body': json.dumps({'error': 'Method not allowed'})}

def handle_notifications(method: str, event: Dict[str, Any], conn, cur) -> Dict[str, Any]:
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        user_id = params.get('userId')
        
        if not user_id:
            return {'statusCode': 400, 'body': json.dumps({'error': 'User ID required'})}
        
        cur.execute(f"SELECT * FROM notifications WHERE user_id = {escape_sql_string(user_id)} ORDER BY created_at DESC")
        notifications = cur.fetchall()
        
        return {'statusCode': 200, 'body': json.dumps({'notifications': [dict(n) for n in notifications]}, default=str)}
    
    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        
        query = f"""INSERT INTO notifications (user_id, type, message, data) 
                   VALUES ({escape_sql_string(body['userId'])}, {escape_sql_string(body['type'])}, 
                           {escape_sql_string(body['message'])}, '{json.dumps(body.get('data', {}))}'::jsonb) 
                   RETURNING *"""
        cur.execute(query)
        notification = cur.fetchone()
        
        return {'statusCode': 201, 'body': json.dumps({'notification': dict(notification)}, default=str)}
    
    elif method == 'PUT':
        body = json.loads(event.get('body', '{}'))
        notification_id = body.get('notificationId')
        
        if body.get('action') == 'read':
            cur.execute(f"UPDATE notifications SET is_read = TRUE WHERE id = {escape_sql_string(notification_id)}")
            return {'statusCode': 200, 'body': json.dumps({'success': True})}
    
    return {'statusCode': 405, 'body': json.dumps({'error': 'Method not allowed'})}

def handle_logs(method: str, event: Dict[str, Any], conn, cur) -> Dict[str, Any]:
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        limit = int(params.get('limit', 100))
        
        cur.execute(f"SELECT * FROM logs ORDER BY created_at DESC LIMIT {limit}")
        logs = cur.fetchall()
        
        return {'statusCode': 200, 'body': json.dumps({'logs': [dict(log) for log in logs]}, default=str)}
    
    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        
        query = f"""INSERT INTO logs (user_id, user_name, action, details) 
                   VALUES ({escape_sql_string(body['userId'])}, {escape_sql_string(body['userName'])}, 
                           {escape_sql_string(body['action'])}, '{json.dumps(body.get('details', {}))}'::jsonb) 
                   RETURNING *"""
        cur.execute(query)
        log = cur.fetchone()
        
        return {'statusCode': 201, 'body': json.dumps({'log': dict(log)}, default=str)}
    
    return {'statusCode': 405, 'body': json.dumps({'error': 'Method not allowed'})}

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    
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
    
    params = event.get('queryStringParameters') or {}
    resource = params.get('resource', 'users')
    
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
        result['isBase64Encoded'] = False
        
        return result
        
    except Exception as e:
        if conn:
            try:
                conn.close()
            except:
                pass
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        if conn:
            try:
                conn.close()
            except:
                pass