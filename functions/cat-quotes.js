const mysql = require('mysql2/promise');

let pool = null;

function getDbPool() {
  if (pool) return pool;

  // Hỗ trợ kết nối qua URI hoặc từng thông số riêng lẻ của Aiven MySQL
  const connectionUri = process.env.AIVEN_MYSQL_URI || process.env.DATABASE_URL;

  if (connectionUri) {
    pool = mysql.createPool({
      uri: connectionUri,
      waitForConnections: true,
      connectionLimit: 5,
      ssl: {
        rejectUnauthorized: false,
      },
    });
    return pool;
  }

  const host = process.env.AIVEN_MYSQL_HOST || process.env.MYSQL_HOST;
  const port = parseInt(process.env.AIVEN_MYSQL_PORT || process.env.MYSQL_PORT || '3306', 10);
  const user = process.env.AIVEN_MYSQL_USER || process.env.MYSQL_USER;
  const password = process.env.AIVEN_MYSQL_PASSWORD || process.env.MYSQL_PASSWORD;
  const database = process.env.AIVEN_MYSQL_DATABASE || process.env.MYSQL_DATABASE || 'defaultdb';

  if (!host || !user) {
    return null;
  }

  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    ssl: {
      rejectUnauthorized: false,
    },
    waitForConnections: true,
    connectionLimit: 5,
  });

  return pool;
}

async function initTable(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS cat_quotes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      content VARCHAR(500) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

exports.handler = async function (event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  let db = null;
  try {
    db = getDbPool();
  } catch (err) {
    console.error('Lỗi khởi tạo pool MySQL:', err);
  }

  if (!db) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        connected: false,
        message: 'Aiven MySQL chưa được cấu hình biến môi trường (AIVEN_MYSQL_URI) trên Netlify.',
        quotes: [],
      }),
    };
  }

  try {
    await initTable(db);

    if (event.httpMethod === 'GET') {
      const [rows] = await db.query('SELECT id, content FROM cat_quotes ORDER BY id ASC');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          connected: true,
          quotes: rows,
        }),
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const content = (body.content || '').trim();
      if (!content) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Nội dung câu nói không được để trống' }),
        };
      }
      const [result] = await db.query(
        'INSERT INTO cat_quotes (content) VALUES (?) ON DUPLICATE KEY UPDATE content = VALUES(content)',
        [content]
      );
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          id: result.insertId,
          content,
        }),
      };
    }

    if (event.httpMethod === 'DELETE') {
      const body = JSON.parse(event.body || '{}');
      const id = body.id || (event.queryStringParameters && event.queryStringParameters.id);
      const content = body.content || (event.queryStringParameters && event.queryStringParameters.content);

      if (id) {
        await db.query('DELETE FROM cat_quotes WHERE id = ?', [id]);
      } else if (content) {
        await db.query('DELETE FROM cat_quotes WHERE content = ?', [content]);
      } else {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Thiếu id hoặc content để xóa' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Phương thức không được hỗ trợ' }),
    };
  } catch (error) {
    console.error('Lỗi thao tác MySQL:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        connected: false,
        error: 'Lỗi truy vấn cơ sở dữ liệu: ' + error.message,
      }),
    };
  }
};
