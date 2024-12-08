const express = require('express');
const mysql = require('mysql2');
const scales = require('../sql').scales;
const products = require('../sql').products;
const router = express.Router();
const MaxScales = 10;

router.get('/', (req, res) => {
  const db = mysql.createConnection({
    host: 'localhost',
    user: 'pikabi',
    password: '1',
    database: 'pc',
  });

	const { id } = req.query;
	if (!id) {
		return res.status(400).json({ message: '请先登录。' });
	}
	db.query(scales.queryAll, id, (err1, result) => {
		if (err1) {
				return res.status(500).json({ message: '数据异常，请重新操作。' });
		}
		const productDetails = [];
		if (!result || result.length === 0) {
				return res.status(200).json(productDetails);
		}
		let pendingQueries = result.length;
		result.forEach(item => {
				db.query(products.queryById, item.product_id, (err2, product) => {
				if (err2) {
						return res.status(500).json({ message: '获取产品信息失败，请重试。' });
				}
				if (product.length !== 1) {
						return res.status(500).json({ message: '获取产品信息失败，请重试。' });
				}
				current = product[0];
				productDetails.push(current);
				if (--pendingQueries === 0) {
					const minPrice = Math.min.apply(Math, productDetails.map(function(o) { return Number(o.price); }));
					let maxSale = Math.max.apply(Math, productDetails.map(function(o) { return Number(o.total_sales); }));
          let maxComment = Math.max.apply(Math, productDetails.map(function(o) { return Number(o.comment); }));
          const maxVariety = Math.max.apply(Math, productDetails.map(function(o) { return Number(o.variety) <= 0? 1: Math.log2(Number(o.variety)); }));
          maxSale = (maxSale === 0 ? 1 : maxSale);
          maxComment = (maxComment === 0 ? 1 : maxComment);
					productDetails.forEach(function(o) {
						o.priceRating = 3.0 * minPrice / Number(o.price) + 2.0 * Math.min(200 / Number(o.price), 1.0);
            if (o.platform === 'jd') {
              o.hotRating = 2 + 1.5 * Number(o.comment) / maxComment + 1.5 * Number(o.comment) / Math.max(maxSale * 250, maxComment);
            }
            else {
              o.hotRating = 2 + 1.5 * Number(o.total_sales) / maxSale + 1.5 * Number(o.total_sales) / Math.max(maxSale, maxComment / 250);
            }
            discount = Math.min(o.extraPrice / Number(o.price), 1.0);
            if (discount < 0.5) {
              o.discountRating = 5.0
            }
            else {
						  o.discountRating = -2 * discount * discount + 5.5;
            }
            if(Number(o.variety) <= 1) {
              o.varietyRating = 1;
            }
            else {
              o.varietyRating = Math.log2(Number(o.variety) <= 0? 1: Number(o.variety)) / maxVariety * 2 + Math.min(Math.log2(Number(o.variety) <= 0? 1: Number(o.variety)) / 3, 2) + 1;
            }
            o.priceRating = Math.sqrt(o.priceRating / 5) * 5;
            o.hotRating = Math.sqrt(o.hotRating / 5) * 5;
            o.discountRating = Math.sqrt(o.discountRating / 5) * 5;
            o.varietyRating = Math.sqrt(o.varietyRating / 5) * 5;
					});
					return res.status(200).json(productDetails);
				}
			});
		});
	});
});
	
router.post('/insert', (req, res) => {
  const db = mysql.createConnection({
    host: 'localhost',
    user: 'pikabi',
    password: '1',
    database: 'pc',
  });
  
  const { user_id, product_id } = req.body;
  if (!user_id || !product_id) {
      return res.status(400).json({ message: '参数错误。' });
  }
  db.query(scales.queryAll, user_id, (err, result) => {
    if (err) {
        return res.status(500).json({ message: '数据异常，请重新操作。' });
    }
    if (result.length >= MaxScales) {
        return res.status(400).json({ message: '比较商品过多，请取消比较后再试。' });
    }
    db.query(scales.insertScale, [user_id, product_id], (err) => {
        if (err) {
            return res.status(500).json({ message: '数据异常，请重新操作。' });
        }
        res.status(200).json({ message: '加入比较成功！' });
        db.end();
    });
  });
});

router.post('/delete', (req, res) => {
  const db = mysql.createConnection({
    host: 'localhost',
    user: 'pikabi',
    password: '1',
    database: 'pc',
  });
  
  const { user_id, product_id } = req.body;
  if (!user_id || !product_id) {
      return res.status(400).json({ message: '参数错误。' });
  }
  db.query(scales.deleteScale, [user_id, product_id], (err) => {
      if (err) {
          return res.status(500).json({ message: '数据异常，请重新操作。' });
      }
      res.status(200).json({ message: '取消比较成功！' });
      db.end();
  });
});

module.exports = router;
