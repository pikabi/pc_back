const express = require('express');
const mysql = require('mysql2');
const users = require('../sql').users;
const systemMessages = require('../sql').systemMessages;
const router = express.Router();
const nodemailer = require('nodemailer');

const verificationCodes = new Map(); 

router.post('/email', (req, res) => {
  const {email} = req.body;
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ message: '无效的邮箱地址' });
  }
  require('dotenv').config({ path: '../.env' });
  const transporter = nodemailer.createTransport({
    service: 'qq',
    auth: {
      user: '943246512@qq.com',
      pass: process.env.EMAIL_AUTH_CODE
    }
  });

  const sendVerificationEmail = (toEmail, verificationCode, callback) => {
    const mailOptions = {
      from: '943246512@qq.com',
      to: toEmail,     
      subject: '【验证码】Erute Shopping',  
      text: `您的验证码是：${verificationCode}` 
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return callback(error, null);
      } else {
        return callback(null, info.response);
      }
    });
  };

  const verificationCode = Math.floor(100000 + Math.random() * 900000);

  sendVerificationEmail(email, verificationCode, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: '发送验证码失败' });
    }
    const expiresAt = Date.now() + 5 * 60 * 1000;
    verificationCodes.set(email, { verificationCode, expiresAt });
    console.log(`验证码已保存，用户邮箱: ${email}, 验证码: ${verificationCode}, 过期时间: ${new Date(expiresAt)}`);
    res.status(200).json({ message: '验证码已发送' });
  });
});

router.post('/register', (req, res) => {
  const db = mysql.createConnection({
    host: 'localhost',
    user: 'pikabi',
    password: '1',
    database: 'pc',
  });

  const { name, email, password, captcha} = req.body;
  console.log(req.body);
  if (!name || !email || !password || !captcha) {
    return res.status(400).json({ message: '所有字段都需要填写（name, email, password, captcha）' });
  }
  if (!verificationCodes.has(email)) {
    return res.status(400).json({ message: '验证码不存在！' });
  }
  const { verificationCode: correctCode, expiresAt } = verificationCodes.get(email);
  if (Date.now() > expiresAt) {
    verificationCodes.delete(email);
    return res.status(400).json({ message: '验证码已过期！' });
  }
  if (Number(captcha) !== Number(correctCode)) {
    return res.status(400).json({ message: '验证码错误！' });
  }
  db.query(users.queryByUsername, [name], (err, result1) => {
    if (err) return res.status(500).json({ message: '数据异常，请重新注册。' });
    if (result1.length > 0) return res.status(400).json({ message: `用户名 ${name} 已被注册。` });
    db.query(users.queryByEmail, [email], (err, result2) => {
      if (err) return res.status(500).json({ message: '数据异常，请重新注册。1' });
      if (result2.length > 0) return res.status(400).json({ message: `邮箱 ${email} 已被注册。` });
      const newUser = [name, email, password];
      
      db.query(users.insertUser, newUser, (err, result) => {
        if (err) return res.status(500).json({ message: '数据异常，请重新注册。' });
        db.query(systemMessages.insertSystemMessage, [result.insertId, '注册通知', '欢迎注册 Erute Shopping ！'], (err) => {
          if(err) return res.status(500).json({ message: '数据异常，请重新注册。' });
          res.status(200).json({ message: '注册成功。请登录。' });
          verificationCodes.delete(email);
          db.end();
        });
      });
    });
  });
});

router.post('/login', (req, res) => {
  const db = mysql.createConnection({
    host: 'localhost',
    user: 'pikabi',
    password: '1',
    database: 'pc',
  });

  const { name, email, password, loginTime} = req.body;
  if(!name) {
    db.query(users.queryByEmail, [email], (err, result) => {
      if (err) {
        return res.status(500).json({ message: '数据异常，请重新登录。' });
      }
      if (result.length === 0) {
        return res.status(401).json({ message: '邮箱或密码错误。' });
      }
      const user = result[0];
      if (user.password !== password) {
        return res.status(401).json({ message: '邮箱或密码错误。' });
      }
      db.query(users.updateLogintime, [loginTime, user.user_id], (err) => {
        if (err) {
          return res.status(500).json({ message: '数据异常，请重新登录。' });
        }
        res.status(200).json({ 
          message: '登录成功。',
          id: user.user_id,
          name: user.username,
          email: user.email,
          phone: user.phone,
          country: user.country,
          address: user.address,
        });
        db.end();
      });
    });
  }
  else if(!email) {
    db.query(users.queryByUsername, [name], (err, result) => {
      if (err) {
        return res.status(500).json({ message: '数据异常，请重新登录。' });
      }
      if (result.length === 0) {
        return res.status(401).json({ message: '用户名或密码错误。1' });
      }
      const user = result[0];
      if (user.password !== password) {
        return res.status(401).json({ message: `用户名或密码错误。${password} ${user.password}` });
      }
      db.query(users.updateLogintime, [loginTime, user.user_id], (err) => {
        if (err) {
          return res.status(500).json({ message: '数据异常，请重新登录。' });
        }
        res.status(200).json({ 
          message: '登录成功。',
          id: user.user_id,
          name: user.username,
          email: user.email,
          phone: user.phone,
          country: user.country,
          address: user.address,
        });
        db.end();
      });
    });
  }
});

router.post('/update', (req, res) => {
  const db = mysql.createConnection({
    host: 'localhost',
    user: 'pikabi',
    password: '1',
    database: 'pc',
  });

  const { id, userPhone, userCountry, userAddress } = req.body;
  if (!id) {
    return res.status(400).json({ message: '请先登录。' });
  }

  db.query(users.updateUser, [userPhone, userCountry, userAddress, id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: '数据异常。' });
    }
    res.status(200).json({ message: '更新成功。' });
    db.end();
  });
});

module.exports = router;
