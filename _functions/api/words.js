import mysql from 'mysql2/promise';

let pool;
function getPool(env) {
    if (!pool) {
        pool = mysql.createPool({
            host: env.DB_HOST,
            user: env.DB_USER,
            password: env.DB_PASSWORD,
            database: env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 5,
            queueLimit: 0,
            disableEval: true
        });
    }
    return pool;
}

// GET /api/words
export async function onRequestGet(context) {
    try {
        const { searchParams } = new URL(context.request.url);
        const week = searchParams.get('week');
        const day = searchParams.get('day');
        const date = searchParams.get('date');

        const db = getPool(context.env);

        let query = "SELECT word_id as id, DATE_FORMAT(study_date, '%Y-%m-%d') as study_date, week_num as week, day_of_week as day, word, meaning, example_en as example, example_ko as korEx FROM vocab_words";
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

        // Sort by study_date and word_id
        query += ' ORDER BY study_date ASC, word_id ASC';

        const [rows] = await db.query(query, params);

        return new Response(JSON.stringify(rows), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// POST /api/words
export async function onRequestPost(context) {
    try {
        const body = await context.request.json();
        const { week, day, word, meaning, example, korEx, study_date } = body;

        if (!word || !meaning) {
            return new Response(JSON.stringify({ error: 'Word and meaning are required' }), {
                status: 400,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        const db = getPool(context.env);
        const date = study_date || new Date().toISOString().split('T')[0];

        const [result] = await db.query(
            'INSERT INTO vocab_words (study_date, week_num, day_of_week, word, meaning, example_en, example_ko) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [date, week || 1, day || 'Mon', word, meaning, example || 'No example', korEx || '예문 없음']
        );

        return new Response(JSON.stringify({ message: 'Word registered successfully', id: result.insertId }), {
            status: 201,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// OPTIONS preflight
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
