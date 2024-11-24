const mysql = require('mysql2');

// 创建连接
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'test_user',
  password: 'password',
  database: 'test_db'
});

// 连接数据库
connection.connect(err => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to MySQL database!');

  // 执行查询
  connection.query('SELECT 1 + 1 AS result', (err, results) => {
    if (err) throw err;
    console.log('Query result:', results);
  });

  // 关闭连接
  connection.end();
});
