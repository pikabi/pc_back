const { query } = require("express");

const users = {
    queryByUsername: 'SELECT * FROM users WHERE username=?',
    queryByEmail: 'SELECT * FROM users WHERE email=?',
    queryLogintime: 'SELECT * FROM users WHERE user_id=?',
    queryAll: 'SELECT * FROM users',
    updateSeed: 'UPDATE users SET seed=?,last_login_time=? WHERE user_id=?',
    insertUser:'INSERT INTO users (username,email, password) VALUES (?, ?, ?)',
    updateUser: 'UPDATE users SET phone=?,country=?,address=? WHERE user_id=?',
    updateLogintime: 'UPDATE users SET last_login_time=? WHERE user_id=?',
    updateUnreadMessage: 'UPDATE users SET unread_messages=? WHERE user_id=?',
};

const products = {
    count: 'SELECT COUNT(*) FROM products',
    queryPrice: 'SELECT * FROM product_price_history WHERE product_id=? ORDER BY price_date DESC LIMIT 1',
    queryImg: 'SELECT image_url FROM product_img WHERE product_id=?',
    queryName: 'SELECT name, image_url FROM product_name WHERE product_id=?',
    querySize: 'SELECT name FROM product_size WHERE product_id=?',
    queryMode: 'SELECT name FROM product_mode WHERE product_id=?',
    queryType: 'SELECT name FROM product_type WHERE product_id=?',
    queryRandom: 'SELECT * FROM products ORDER BY RAND() LIMIT ?',
    queryAll: 'SELECT * FROM products ORDER BY RAND(?) LIMIT ? OFFSET ?',
    queryById: 'SELECT * FROM products WHERE id=?',
    insertProduct: 'INSERT INTO products (name, price, total_sales, image_url, total_stock, rating, url, has_model, has_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
};

const favourites = {
    queryAll: 'SELECT * FROM user_product_favourites WHERE user_id=?',
    insertFavourite: 'INSERT INTO user_product_favourites (user_id, product_id) VALUES (?, ?)',
    deleteFavourite: 'DELETE FROM user_product_favourites WHERE user_id=? AND product_id=?',
};

const scales = {
    queryAll: 'SELECT * FROM user_product_scales WHERE user_id=?',
    insertScale: 'INSERT INTO user_product_scales (user_id, product_id) VALUES (?, ?)',
    deleteScale: 'DELETE FROM user_product_scales WHERE user_id=? AND product_id=?',
}

const dropMessages = {
    queryAll: 'SELECT * FROM user_price_drop_alerts WHERE user_id=? ORDER BY id DESC LIMIT 10 OFFSET ?',
    insertdropMessages: 'INSERT INTO user_price_drop_alerts (user_id, product_name, product_url) VALUES (?, ?, ?)',
}

const systemMessages = {
    queryAll: 'SELECT * FROM user_system_messages WHERE user_id=? ORDER BY id DESC LIMIT 10 OFFSET ?',
    insertSystemMessage: 'INSERT INTO user_system_messages (user_id, title, body) VALUES (?, ?, ?)',
}

module.exports = { users, products, favourites, scales, dropMessages, systemMessages };