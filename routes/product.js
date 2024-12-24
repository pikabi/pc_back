const express = require('express');
const mysql = require('mysql2');
const nodejieba = require('nodejieba');
const natural = require('natural');
const fs = require('fs');
const router = express.Router();
const products = require('../sql').products;
const users = require('../sql').users;
const favourites = require('../sql').favourites;
const scales = require('../sql').scales;
const tokenizer = new natural.WordTokenizer();
const stopwordsPath = './stopwords-iso.json';
const stopwordsData = JSON.parse(fs.readFileSync(stopwordsPath, 'utf8'));
const stopwords = stopwordsData.zh.concat(stopwordsData.en); 
const stopwordsSet = new Set(stopwords);
const numPerPage = 30;

function checkProductIds(id, productIds, callback) {
  const db = mysql.createConnection({
    host: 'localhost',
    user: 'pikabi',
    password: '1',
    database: 'pc',
  });
  const placeholders = productIds.map(() => '?').join(', ');
  const sqlScales = `SELECT product_id FROM user_product_scales WHERE user_id = ? AND product_id IN (${placeholders})`;
  const sqlFavourites = `SELECT product_id FROM user_product_favourites WHERE user_id = ? AND product_id IN (${placeholders})`;
  db.query(sqlScales, [id, ...productIds], (err, result) => {
    if (err) {
      return callback(err, [], []);
    }
    let foundProductIds = result.map(row => row.product_id);
    let checkResults = productIds.map(product_id => ({
      product_id,
      inScale: foundProductIds.includes(product_id)
    }));
    db.query(sqlFavourites, [id, ...productIds], (err, result) => {
      if (err) {
        return callback(err, []);
      }
      foundProductIds = result.map(row => row.product_id);
      checkResults.forEach(result => {
        result.isFavourite = foundProductIds.includes(result.product_id);
      });
      callback(null, checkResults);
    });
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
  

router.get('/search', (req, res) => {
  const db = mysql.createConnection({
    host: 'localhost',
    user: 'pikabi',
    password: '1',
    database: 'pc',
  });

  const { id, query, page } = req.query;
  db.query(users.queryLogintime, id, (err, result) => {
    if (err) {
      return res.status(500).json({ message: '数据异常，请重新操作。' });
    }
    const user = result[0];
    if (!user) {
      return res.status(400).json({ message: '用户不存在。' });
    }
    const currentTimestamp = Date.now();
    const seedTimestamp = user.last_login_time;
    let seed = user.seed;
    if (!(seed && seedTimestamp && currentTimestamp - seedTimestamp < 1800000)) {
      seed = Math.floor(Math.random() * 1000000);
      db.query(users.updateSeed, [seed, currentTimestamp.toString(), id], (err) => {
        if (err) {
          return res.status(500).json({ message: '数据异常，请重新操作。' });
        }
      });
    }
    
    if(query){
      const segments = query.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+|\s+|[0-9]+|[^\u4e00-\u9fa5a-zA-Z\s]/g);
      const originWords = segments.map(word => {
        if (/[\u4e00-\u9fa5]/.test(word)) {
          return nodejieba.cut(word); // 中文分词
        } else if (/[a-zA-Z]+/.test(word)) {
          return tokenizer.tokenize(word); // 英文分词
        } else if (/[0-9]+/.test(word)) {
          return word; // 保留空格或符号
        }
        else {
          return null;
        }
      })
      .filter(word => word !== null)
      .flat();
      const filteredWords = originWords.filter(word => !stopwordsSet.has(word.trim()));
      if(filteredWords.length === 0){
        db.query(products.count, (err, result) => {
          if(err){
            return res.status(500).json({ message: '数据异常，请重新操作。' });
          }
          const num = result[0]['COUNT(*)'];
          if(num === 0){
            return res.status(500).json({ message: '没有找到相关商品。' });
          }
          if(num <= (Number(page) - 1) * numPerPage){
            return res.status(500).json({ message: '超出页数！' });
          }
          db.query(products.queryAll, [seed, numPerPage, (page - 1) * numPerPage], (err, result) => {
            if (err) {
              return res.status(500).json({ message: '数据异常，请重新操作。' });
            }
            const prudctIds = result.map(product => product.id);
            checkProductIds(id, prudctIds, (err, checkResults) => {
              if (err) {
                return res.status(500).json({ message: '数据异常，请重新操作。' });
              }
              result.forEach(product => {
                const checkResult = checkResults.find(checkResult => checkResult.product_id === product.id);
                product.inScale = checkResult.inScale;
                product.isFavourite = checkResult.isFavourite;
              });
              result = handleRating(result);
              return res.status(200).json({
                result: result,
                num: Math.min(67656, num),
              });
            });
          });
        });
      }
      else {
        const sqlCnt = `SELECT COUNT(*) FROM products WHERE MATCH(name) AGAINST ('${filteredWords.join(' ')}' IN NATURAL LANGUAGE MODE)`;
        db.query(sqlCnt, (err, result) => {
          if(err){
            return res.status(500).json({ message: '数据异常，请重新操作。' });
          }
          const num = result[0]['COUNT(*)'];
          if(num === 0){
            console.log('没有找到相关商品。'); 
            return res.status(500).json({ message: '没有找到相关商品。' });
          }
          if(num <= (Number(page) - 1) * numPerPage){
            return res.status(500).json({ message: '超出页数！' });
          }
          
          // const searchQuery = filteredWords.map(word => `name LIKE '%${word}%'`).join(' OR ');
          // const sql = `SELECT * FROM products WHERE ${searchQuery}`;
          const sql = `SELECT * FROM products WHERE MATCH(name) AGAINST ('${filteredWords.join(' ')}' IN NATURAL LANGUAGE MODE) LIMIT ${numPerPage} OFFSET ${(page - 1) * numPerPage}`; 
          db.query(sql, (err, result) => {
            if (err) {
              return res.status(500).json({ message: '数据异常，请重新操作。' });
            }
            const prudctIds = result.map(product => product.id);
            checkProductIds(id, prudctIds, (err, checkResults) => {
              if (err) {
                return res.status(500).json({ message: '数据异常，请重新操作。' });
              }
              result.forEach(product => {
                const checkResult = checkResults.find(checkResult => checkResult.product_id === product.id);
                product.inScale = checkResult.inScale;
                product.isFavourite = checkResult.isFavourite;
              });
              result = handleRating(result);
              res.status(200).json({
                result: result,
                num: num,
              });
              db.end();
            });
          });
        });
      }
    }
    else {
      db.query(products.count, (err, result) => {
        if(err){
          return res.status(500).json({ message: '数据异常，请重新操作。' });
        }
        const num = result[0]['COUNT(*)'];
        if(num === 0){
          return res.status(500).json({ message: '没有找到相关商品。' });
        }
        if(num <= (Number(page) - 1) * numPerPage){
          return res.status(500).json({ message: '超出页数！' });
        }
        db.query(products.queryAll, [seed, numPerPage, (page - 1) * numPerPage], (err, result) => {
          if (err) {
            return res.status(500).json({ message: '数据异常，请重新操作。' });
          }
          const prudctIds = result.map(product => product.id);
          checkProductIds(id, prudctIds, (err, checkResults) => {
            if (err) {
              return res.status(500).json({ message: '数据异常，请重新操作。' });
            }
            result.forEach(product => {
              const checkResult = checkResults.find(checkResult => checkResult.product_id === product.id);
              product.inScale = checkResult.inScale;
              product.isFavourite = checkResult.isFavourite;
            });
            result = handleRating(result);
            return res.status(200).json({
              result: result,
              num: Math.min(67656, num),
            });
          });
        });
      });
    }
  });
});


router.get('/random', (req, res) => {
  const db = mysql.createConnection({
    host: 'localhost',
    user: 'pikabi',
    password: '1',
    database: 'pc',
  });

  db.query(products.queryRandom, 25, (err, result) => {
    if (err) {
      return res.status(500).json({ message: '数据异常，请重新操作。' });
    }
    result = handleRating(result);
    result.sort((a, b) => b.ratingAll - a.ratingAll);
    result = result.slice(0, 2);
    return res.status(200).json(result);
  });
});

router.get('/detail', (req, res) =>{
  const db = mysql.createConnection({
    host: 'localhost',
    user: 'pikabi',
    password: '1',
    database: 'pc',
  });

  const { id, product_id } = req.query;
  if (!product_id) {
    return res.status(400).json({ message: '参数错误。' });
  }
  db.query(products.queryById, product_id, (err, result) => {
    if (err) {
      return res.status(500).json({ message: '数据异常，请重新操作。' });
    }
    if (result.length === 0) {
      return res.status(400).json({ message: '商品不存在。' });
    }
    const prudctIds = result.map(product => product.id);
    checkProductIds(id, prudctIds, (err, checkResults) => {
      if (err) {
        return res.status(500).json({ message: '数据异常，请重新操作。' });
      }
      result.forEach(product => {
        const checkResult = checkResults.find(checkResult => checkResult.product_id === product.id);
        product.inScale = checkResult.inScale;
        product.isFavourite = checkResult.isFavourite;
      });
      result = handleRating(result);
      const product = result[0];
      const attriName1 = product.attriName1;
      const attriName2 = product.attriName2;
      const attriName3 = product.attriName3;
      const attriName4 = product.attriName4;
      db.query(products.queryImg, product_id, (err, result) => {
        if (err) {
          return res.status(500).json({ message: '数据异常，请重新操作1。' });
        }
        let imgList = result.map(row => row.image_url);
        imgList.unshift(product.image_url);
        db.query(products.queryName, product_id, (err, result) => {
          if (err) {
            return res.status(500).json({ message: '数据异常，请重新操作2。' });
          }
          const attriListName = result.map(row => row.name);
          const attriListImg = result.map(row => row.image_url);

          if (product.has_size === 1) {
            db.query(products.querySize, product_id, (err, result) => {
              if (err) {
                return res.status(500).json({ message: '数据异常，请重新操作3。' });
              }
              const attriListSize = result.map(row => row.name);
              if (product.has_mode === 1) {
                db.query(products.queryMode, product_id, (err, result) => {
                  if (err) {
                    return res.status(500).json({ message: '数据异常，请重新操作4。' });
                  }
                  const attriListMode = result.map(row => row.name);
                  if (product.has_type === 1) {
                    db.query(products.queryType, product_id, (err, result) => {
                      if (err) {
                        return res.status(500).json({ message: '数据异常，请重新操作5。' });
                      }
                      const attriListType = result.map(row => row.name);
                      return res.status(200).json({
                        product,
                        imgList,
                        attriName1,
                        attriName2,
                        attriName3,
                        attriName4,
                        attriListName,
                        attriListImg,
                        attriListSize,
                        attriListMode,
                        attriListType,
                      });
                    });
                  }
                  else {
                    return res.status(200).json({
                      product,
                      imgList,
                      attriName1,
                      attriName2,
                      attriName3,
                      attriName4,
                      attriListName,
                      attriListImg,
                      attriListSize,
                      attriListMode,
                    });
                  }
                });
              }
              else {
                return res.status(200).json({
                  product,
                  imgList,
                  attriName1,
                  attriName2,
                  attriName3,
                  attriName4,
                  attriListName,
                  attriListImg,
                  attriListSize,
                });
              }
            });
          }
          else {
            return res.status(200).json({
              product,
              imgList,
              attriName1,
              attriName2,
              attriName3,
              attriName4,
              attriListName,
              attriListImg,
            });
          }
        });
      });
    });
  });
});

router.get('/history', (req, res) => {
  const db = mysql.createConnection({
    host: 'localhost',
    user: 'pikabi',
    password: '1',
    database: 'pc',
  });

  const { id } = req.query;
  db.query(products.queryPriceSequence, id, (err, result) => {
    if (err) {
      return res.status(500).json({ message: '数据异常，请重新操作。' });
    }
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);
    const answer = result.filter(row => new Date(row.price_date) >= oneMonthAgo);
    const temp = result.filter(row => new Date(row.price_date) < oneMonthAgo);
    answer.reverse();
    const date = answer.map(row => row.price_date.toISOString().split('T')[0]);
    const price = answer.map(row => row.price);
    const parseDate = (dateStr) => new Date(dateStr);
    const formatDate = (date) => date.toISOString().split('T')[0];
    const startDate = parseDate(date[0]);
    const endDate = parseDate(date[date.length - 1]);

    const completeDates = [];
    const completePrices = [];
    if (temp.length > 0)
      for (let d = oneMonthAgo; d < startDate; d.setDate(d.getDate() + 1)) {
        completeDates.push(formatDate(new Date(d)));
        completePrices.push(temp[0].price);
      }

    let priceIndex = 0;
    for (let d = startDate; d < endDate; d.setDate(d.getDate() + 1)) {
        completeDates.push(formatDate(new Date(d)));
        if (priceIndex != date.length - 1 && date[priceIndex+1] <= formatDate(new Date(d))) {
            priceIndex++;
        }
        completePrices.push(price[priceIndex]);
    }
    priceIndex = priceIndex+1;
    for (let d = endDate; d <= now; d.setDate(d.getDate() + 1)) {
      completeDates.push(formatDate(new Date(d)));
      completePrices.push(price[priceIndex]);
    }
    

    return res.status(200).json({
      date:completeDates,
      price:completePrices,
    });
  });

});

module.exports = router;
