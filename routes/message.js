const express = require('express');
const mysql = require('mysql2');
const { favourites } = require('../sql');
const users = require('../sql').users;
const dropMessages = require('../sql').dropMessages;
const systemMessages = require('../sql').systemMessages;
const router = express.Router();
const nodemailer = require('nodemailer');

router.post('/mail', (req, res) => {
	const {email, name} = req.body;
	require('dotenv').config({ path: '../.env' });
  const transporter = nodemailer.createTransport({
    service: 'qq',
    auth: {
      user: '943246512@qq.com',
      pass: process.env.EMAIL_AUTH_CODE
    }
  });

	const sendVerificationEmail = (toEmail, name, callback) => {
    const mailOptions = {
      from: '943246512@qq.com',
      to: toEmail,     
      subject: '【降价提醒】Erute Shopping',  
      text: `您关注的商品${name}已降价，请查看。` 
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return callback(error, null);
      } else {
        return callback(null, info.response);
      }
    });
  };

	console.log(`发送邮件，用户邮箱: ${email}, 商品名称: ${name}`);
	sendVerificationEmail(email, name, (err, result) => {
		if (err) {
			console.log(err);
			return res.status(500).json({ message: '发送邮件失败' });
		}
		console.log(`邮件已发送，用户邮箱: ${email}, 商品名称: ${name}`);
		res.status(200).json({ message: '邮件已发送' });
	});
});

router.get('/price', (req, res) => {
  const db = mysql.createConnection({
    host: 'localhost',
    user: 'pikabi',
    password: '1',
    database: 'pc',
  });

    const { id, page} = req.query;
    if (!id) {
        return res.status(400).json({ message: '请先登录。' });
    }
    db.query(dropMessages.queryAll, [id, (page - 1) * 10], (err1, result) => {
        if (err1) {
            return res.status(500).json({ message: '数据异常，请重新操作。' });
        }
        db.query(users.updateUnreadMessage, [0, id], (err2) => {
            if (err2) {
                return res.status(500).json({ message: '数据异常，请重新操作。' });
            }
            res.status(200).json(result);
            db.end();
        });
    });
});


router.get('/system', (req, res) => {
    const db = mysql.createConnection({
      host: 'localhost',
      user: 'pikabi',
      password: '1',
      database: 'pc',
    });
  
      const { id, page} = req.query;
      if (!id) {
          return res.status(400).json({ message: '请先登录。' });
      }
      db.query(systemMessages.queryAll, [id, (page - 1) * 10], (err1, result) => {
          if (err1) {
              return res.status(500).json({ message: '数据异常，请重新操作。' });
          }
          db.query(users.updateUnreadMessage, [0, id], (err2) => {
              if (err2) {
                  return res.status(500).json({ message: '数据异常，请重新操作。' });
              }
              res.status(200).json(result);
              db.end();
          });
      });
  });


module.exports = router;
