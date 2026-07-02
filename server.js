require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// GET all words or filter by week/day/date
app.get('/api/words', async (req, res) => {
    try {
        const { week, day, date } = req.query;
        let query = 'SELECT word_id as id, study_date, week_num as week, day_of_week as day, word, meaning, example_en as example, example_ko as korEx FROM vocab_words';
        let params = [];
        let conditions = [];

        if (week) {
            conditions.push('week_num = ?');
            params.push(week);
        }
        if (day) {
            conditions.push('day_of_week = ?');
            params.push(day);
        }
        if (date) {
            conditions.push('DATE(study_date) = ?');
            params.push(date);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// AI Word Suggestion (2nd Grade Level)
app.post('/api/suggest-word', async (req, res) => {
    try {
        const { word } = req.body;
        if (!word) return res.status(400).json({ error: 'Word is required' });

        // Simple mock AI logic for 2nd grade level
        const suggestions = {
            'apple': { meaning: '사과', example: 'I like to eat a red apple.', korEx: '나는 빨간 사과를 먹는 것을 좋아해요.' },
            'banana': { meaning: '바나나', example: 'The monkey is eating a banana.', korEx: '원숭이가 바나나를 먹고 있어요.' },
            'cat': { meaning: '고양이', example: 'My cat is very cute and small.', korEx: '내 고양이는 아주 귀엽고 작아요.' },
            'dog': { meaning: '개', example: 'I play with my dog in the park.', korEx: '나는 공원에서 내 강아지와 놀아요.' },
            'book': { meaning: '책', example: 'I read a story book every night.', korEx: '나는 밤마다 동화책을 읽어요.' },
            'school': { meaning: '학교', example: 'I go to school with my friends.', korEx: '나는 친구들과 함께 학교에 가요.' },
            'water': { meaning: '물', example: 'Please give me some cold water.', korEx: '시원한 물 좀 주세요.' },
            'friend': { meaning: '친구', example: 'Se-won is my best friend.', korEx: '세원이는 나의 가장 친한 친구예요.' }
        };

        const lowerWord = word.toLowerCase();
        let result = suggestions[lowerWord];

        if (!result) {
            // Generic fallback if not in mock database
            result = {
                meaning: '뜻을 입력해주세요',
                example: `This is a ${lowerWord}.`,
                korEx: `이것은 ${lowerWord}입니다.`
            };
        }

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// User registration/login
app.post('/api/users', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const [rows] = await pool.query('SELECT user_id FROM users WHERE user_name = ?', [name]);
        if (rows.length > 0) {
            return res.json({ user_id: rows[0].user_id });
        }

        const [result] = await pool.query('INSERT INTO users (user_name) VALUES (?)', [name]);
        res.status(201).json({ user_id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Quiz history record
app.post('/api/quiz-history', async (req, res) => {
    try {
        const { user_id, study_date, quiz_type, score } = req.body;
        if (!user_id || !quiz_type) return res.status(400).json({ error: 'Missing required fields' });

        // If study_date is not provided, use today's date in YYYY-MM-DD format
        const date = study_date || new Date().toISOString().split('T')[0];

        await pool.query(
            'INSERT INTO quiz_history (user_id, study_date, quiz_type, score) VALUES (?, ?, ?, ?)',
            [user_id, date, quiz_type, score]
        );
        res.status(201).json({ message: 'History recorded' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST a new word
app.post('/api/words', async (req, res) => {
    try {
        const { week, day, word, meaning, example, korEx, study_date } = req.body;
        if (!week || !day || !word || !meaning) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const date = study_date || new Date().toISOString().split('T')[0];

        const [result] = await pool.query(
            'INSERT INTO vocab_words (study_date, week_num, day_of_week, word, meaning, example_en, example_ko) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [date, week, day, word, meaning, example, korEx]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/words/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM vocab_words WHERE word_id = ?', [id]);
        res.json({ message: 'Word deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
