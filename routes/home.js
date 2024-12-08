const express = require('express');
const router = express.Router();

// 处理 /home 路径的 GET 请求
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Home page!' });
});

module.exports = router;
