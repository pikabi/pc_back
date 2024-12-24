const express = require('express');
const mysql = require('mysql2');
const favourites = require('../sql').favourites;
const products = require('../sql').products;
const router = express.Router();
const MaxFavorites = 30;

function checkProductIds(id, productIds, callback) {
  const db = mysql.createConnection({
    host: 'localhost',
    user: 'pikabi',
    password: '1',
    database: 'pc',
  });
  const placeholders = productIds.map(() => '?').join(', ');
  const sqlScales = `SELECT product_id FROM user_product_scales WHERE user_id = ? AND product_id IN (${placeholders})`;
  db.query(sqlScales, [id, ...productIds], (err, result) => {
    if (err) {
      return callback(err, [], []);
    }
    const foundProductIds = result.map(row => row.product_id);
    const checkResults = productIds.map(product_id => ({
      product_id,
      inScale: foundProductIds.includes(product_id)
    }));
    callback(null, checkResults);
  });
}
function handleRating(result) {
  const minPrice = Math.min.apply(Math, result.map(function(o) { return Number(o.price); }));
  let maxSale = Math.max.apply(Math, result.map(function(o) { return Number(o.total_sales); }));
  let maxComment = Math.max.apply(Math, result.map(function(o) { return Number(o.comment); }));
  const maxVariety = Math.max.apply(Math, result.map(function(o) { return Number(o.variety) <= 0? 1: Math.log2(Number(o.variety)); }));
  maxSale = (maxSale === 0 ? 1 : maxSale);
  maxComment = (maxComment === 0 ? 1 : maxComment);
  result.forEach(function(o) {
    priceRating = 3.0 * minPrice / Number(o.price) + 2.0 * Math.min(200 / Number(o.price), 1.0);
    if (o.platform === 'jd') {
      hotRating = 2 + 1.5 * Number(o.comment) / maxComment + 1.5 * Number(o.comment) / Math.max(maxSale * 250, maxComment);
    }
    else {
      hotRating = 2 + 1.5 * Number(o.total_sales) / maxSale + 1.5 * Number(o.total_sales) / Math.max(maxSale, maxComment / 250);
    }
    discount = Math.min(Number(o.extraPrice) / Number(o.price), 1.0);
    if (discount < 0.5) {
      discountRating = 5.0
    }
    else {
      discountRating = -2 * discount * discount + 5.5;
    }
    if(Number(o.variety) <= 1) {
      varietyRating = 1;
    }
    else {
      varietyRating = Math.log2(Number(o.variety) <= 0? 1: Number(o.variety)) / maxVariety * 2 + Math.min(Math.log2(Number(o.variety) <= 0? 1: Number(o.variety)) / 3, 2) + 1;
    }
    priceRating = Math.sqrt(priceRating / 5) * 5;
    hotRating = Math.sqrt(hotRating / 5) * 5;
    discountRating = Math.sqrt(discountRating / 5) * 5;
    varietyRating = Math.sqrt(varietyRating / 5) * 5;
    o.ratingAll = Math.round(Math.sqrt((Number(o.shopRating) + priceRating + hotRating + discountRating + varietyRating) / 25) * 500) / 100;
  });
  return result;
}

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
    db.query(favourites.queryAll, id, (err1, result) => {
      if (err1) {
        return res.status(500).json({ message: '数据异常，请重新操作。' });
      }
      let productDetails = [];
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
          productDetails.push(product[0]);
          if (--pendingQueries === 0) {
            const prudctIds = productDetails.map(product => product.id);
            checkProductIds(id, prudctIds, (err, checkResults) => {
              if (err) {
                return res.status(500).json({ message: '数据异常，请重新操作。' });
              }
              productDetails.forEach(product => {
                const checkResult = checkResults.find(checkResult => checkResult.product_id === product.id);
                product.inScale = checkResult.inScale;
                product.isFavourite = true;
              });
              productDetails = handleRating(productDetails);
              return res.status(200).json(productDetails);
            });
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
  db.query(favourites.queryAll, [user_id], (err, result) => {
    if (err) {
        return res.status(500).json({ message: '数据异常，请重新操作。' });
    }
    if (result.length >= MaxFavorites) {
        return res.status(400).json({ message: '关注商品过多，请取消关注后再试。' });
    }
    db.query(favourites.insertFavourite, [user_id, product_id], (err) => {
        if (err) {
            return res.status(500).json({ message: '数据异常，请重新操作。' });
        }
        res.status(200).json({ message: '关注成功。' });
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
  db.query(favourites.deleteFavourite, [user_id, product_id], (err) => {
      if (err) {
          return res.status(500).json({ message: '数据异常，请重新操作。' });
      }
      res.status(200).json({ message: '取关成功。' });
      db.end();
  });
});

module.exports = router;
