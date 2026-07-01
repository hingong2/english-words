import json
import sqlite3
import urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer
import os

DB_FILE = 'database.db'

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Create vocab_words table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vocab_words (
            word_id INTEGER PRIMARY KEY AUTOINCREMENT,
            study_date TEXT,
            week_num INTEGER,
            day_of_week TEXT,
            word TEXT,
            meaning TEXT,
            example_en TEXT,
            example_ko TEXT
        )
    ''')
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_name TEXT UNIQUE
        )
    ''')
    
    # Create quiz_history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS quiz_history (
            history_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            study_date TEXT,
            quiz_type TEXT,
            score INTEGER,
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        )
    ''')
    
    # Prepopulate with some starter words if empty
    cursor.execute('SELECT COUNT(*) FROM vocab_words')
    if cursor.fetchone()[0] == 0:
        starter_words = [
            # Week 1 Mon (3/2)
            ('2026-03-02', 1, 'Mon', 'apple', '사과', 'I like to eat a red apple.', '나는 빨간 사과를 먹는 것을 좋아해요.'),
            ('2026-03-02', 1, 'Mon', 'banana', '바나나', 'The monkey is eating a banana.', '원숭이가 바나나를 먹고 있어요.'),
            # Week 1 Wed (3/4)
            ('2026-03-04', 1, 'Wed', 'cat', '고양이', 'My cat is very cute and small.', '내 고양이는 아주 귀엽고 작아요.'),
            ('2026-03-04', 1, 'Wed', 'dog', '개', 'I play with my dog in the park.', '나는 공원에서 내 강아지와 놀아요.'),
            # Week 1 Fri (3/6)
            ('2026-03-06', 1, 'Fri', 'book', '책', 'I read a story book every night.', '나는 밤마다 동화책을 읽어요.'),
            ('2026-03-06', 1, 'Fri', 'school', '학교', 'I go to school with my friends.', '나는 친구들과 함께 학교에 가요.')
        ]
        cursor.executemany('''
            INSERT INTO vocab_words (study_date, week_num, day_of_week, word, meaning, example_en, example_ko)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', starter_words)
        
    conn.commit()
    conn.close()

class RequestHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query = urllib.parse.parse_qs(parsed_url.query)

        if path == '/api/words':
            week = query.get('week', [None])[0]
            day = query.get('day', [None])[0]
            date = query.get('date', [None])[0]

            conn = sqlite3.connect(DB_FILE)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            sql = 'SELECT word_id as id, study_date, week_num as week, day_of_week as day, word, meaning, example_en as example, example_ko as korEx FROM vocab_words'
            conditions = []
            params = []

            if week:
                conditions.append('week_num = ?')
                params.append(int(week))
            if day:
                conditions.append('day_of_week = ?')
                params.append(day)
            if date:
                conditions.append('DATE(study_date) = ?')
                params.append(date)

            if conditions:
                sql += ' WHERE ' + ' AND '.join(conditions)

            cursor.execute(sql, params)
            rows = [dict(row) for row in cursor.fetchall()]
            conn.close()

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(rows).encode('utf-8'))
        else:
            self.send_response(404)
            self._send_cors_headers()
            self.end_headers()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8')) if post_data else {}

        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        if path == '/api/users':
            name = data.get('name')
            if not name:
                self.send_response(400)
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Name is required'}).encode('utf-8'))
                conn.close()
                return

            try:
                cursor.execute('SELECT user_id FROM users WHERE user_name = ?', (name,))
                row = cursor.fetchone()
                if row:
                    user_id = row[0]
                else:
                    cursor.execute('INSERT INTO users (user_name) VALUES (?)', (name,))
                    user_id = cursor.lastrowid
                    conn.commit()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'user_id': user_id}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

        elif path == '/api/suggest-word':
            word = data.get('word')
            if not word:
                self.send_response(400)
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Word is required'}).encode('utf-8'))
                conn.close()
                return

            suggestions = {
                'apple': { 'meaning': '사과', 'example': 'I like to eat a red apple.', 'korEx': '나는 빨간 사과를 먹는 것을 좋아해요.' },
                'banana': { 'meaning': '바나나', 'example': 'The monkey is eating a banana.', 'korEx': '원숭이가 바나나를 먹고 있어요.' },
                'cat': { 'meaning': '고양이', 'example': 'My cat is very cute and small.', 'korEx': '내 고양이는 아주 귀엽고 작아요.' },
                'dog': { 'meaning': '개', 'example': 'I play with my dog in the park.', 'korEx': '나는 공원에서 내 강아지와 놀아요.' },
                'book': { 'meaning': '책', 'example': 'I read a story book every night.', 'korEx': '나는 밤마다 동화책을 읽어요.' },
                'school': { 'meaning': '학교', 'example': 'I go to school with my friends.', 'korEx': '나는 친구들과 함께 학교에 가요.' },
                'water': { 'meaning': '물', 'example': 'Please give me some cold water.', 'korEx': '시원한 물 좀 주세요.' },
                'friend': { 'meaning': '친구', 'example': 'Se-won is my best friend.', 'korEx': '세원이는 나의 가장 친한 친구예요.' }
            }
            
            lower_word = word.lower()
            result = suggestions.get(lower_word, {
                'meaning': '뜻을 입력해주세요',
                'example': f'This is a {lower_word}.',
                'korEx': f'이것은 {lower_word}입니다.'
            })

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(result).encode('utf-8'))

        elif path == '/api/quiz-history':
            user_id = data.get('user_id')
            quiz_type = data.get('quiz_type')
            score = data.get('score')
            study_date = data.get('study_date')

            if not user_id or not quiz_type:
                self.send_response(400)
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Missing required fields'}).encode('utf-8'))
                conn.close()
                return

            date = study_date or '2026-07-01'

            try:
                cursor.execute(
                    'INSERT INTO quiz_history (user_id, study_date, quiz_type, score) VALUES (?, ?, ?, ?)',
                    (user_id, date, quiz_type, score)
                )
                conn.commit()
                self.send_response(201)
                self.send_header('Content-Type', 'application/json')
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'message': 'History recorded'}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

        elif path == '/api/words':
            week = data.get('week')
            day = data.get('day')
            word = data.get('word')
            meaning = data.get('meaning')
            example = data.get('example', 'No example')
            korEx = data.get('korEx', '예문 없음')
            study_date = data.get('study_date')

            if not week or not day or not word or not meaning:
                self.send_response(400)
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Missing required fields'}).encode('utf-8'))
                conn.close()
                return

            date = study_date or '2026-07-01'

            try:
                cursor.execute(
                    'INSERT INTO vocab_words (study_date, week_num, day_of_week, word, meaning, example_en, example_ko) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    (date, week, day, word, meaning, example, korEx)
                )
                new_id = cursor.lastrowid
                conn.commit()
                self.send_response(201)
                self.send_header('Content-Type', 'application/json')
                self._send_cors_headers()
                self.end_headers()
                
                res_data = dict(data)
                res_data['id'] = new_id
                self.wfile.write(json.dumps(res_data).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

        conn.close()

    def do_DELETE(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        if path.startswith('/api/words/'):
            try:
                word_id = int(path.split('/')[-1])
            except ValueError:
                self.send_response(400)
                self._send_cors_headers()
                self.end_headers()
                return

            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            try:
                cursor.execute('DELETE FROM vocab_words WHERE word_id = ?', (word_id,))
                conn.commit()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'message': 'Word deleted successfully'}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            finally:
                conn.close()
        else:
            self.send_response(404)
            self._send_cors_headers()
            self.end_headers()

def run(port=3005):
    init_db()
    server_address = ('', port)
    httpd = HTTPServer(server_address, RequestHandler)
    print(f"Backend Server running on port {port} using SQLite...")
    httpd.serve_forever()

if __name__ == '__main__':
    run()
