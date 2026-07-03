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
            queueLimit: 0
        });
    }
    return pool;
}

// DELETE /api/words/:id
export async function onRequestDelete(context) {
    try {
        const { id } = context.params;
        const db = getPool(context.env);

        await db.query('DELETE FROM vocab_words WHERE word_id = ?', [id]);

        return new Response(JSON.stringify({ message: 'Word deleted successfully' }), {
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
            'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
