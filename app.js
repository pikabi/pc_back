const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/user'); 
const homeRoutes = require('./routes/home'); 
const productRoutes = require('./routes/product'); 
const messageRoutes = require('./routes/message');
const favouriteRoutes = require('./routes/favourite');
const scaleRoutes = require('./routes/scale');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'pikabi',
  password: '1',
  database: 'pc',
});

const app = express();
const port = 5000;

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['POST', 'GET'],
  allowedHeaders: ['Content-Type']
}));

app.use(bodyParser.json());

app.use('/user', userRoutes); 
app.use('/home', homeRoutes);
app.use('/product', productRoutes);
app.use('/message', messageRoutes);
app.use('/favourite', favouriteRoutes);
app.use('/scale', scaleRoutes);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
