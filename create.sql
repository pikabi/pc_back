CREATE TABLE `users` (
   `user_id` int NOT NULL AUTO_INCREMENT,
   `username` varchar(50) NOT NULL,
   `email` varchar(100) NOT NULL,
   `password` varchar(255) NOT NULL,
   `phone` varchar(15) DEFAULT NULL,
   `country` varchar(50) DEFAULT NULL,
   `address` varchar(255) DEFAULT NULL,
   `unread_messages` int DEFAULT '0',
   `last_login_time` varchar(32) DEFAULT NULL,
   `seed` varchar(32) DEFAULT NULL,
   PRIMARY KEY (`user_id`),
   UNIQUE KEY `username` (`username`),
   UNIQUE KEY `email` (`email`)
 );

 CREATE TABLE `products` (
   `id` int NOT NULL AUTO_INCREMENT,
   `name` varchar(100) NOT NULL,
   `price` decimal(10,2) NOT NULL,
   `total_sales` int DEFAULT NULL,
   `image_url` varchar(512) DEFAULT NULL,
   `shopRating` decimal(3,2) DEFAULT '0.00',
   `url` varchar(5000) DEFAULT NULL,
   `has_mode` tinyint(1) DEFAULT '0',
   `has_size` tinyint(1) DEFAULT '0',
   `platform` varchar(50) DEFAULT NULL,
   `shopName` varchar(50) DEFAULT NULL,
   `procity` varchar(30) DEFAULT NULL,
   `priceChange` int DEFAULT '0',
   `has_type` tinyint(1) DEFAULT NULL,
   `extraPrice` decimal(10,2) DEFAULT NULL,
   `platformID` bigint DEFAULT NULL,
   `attriName1` varchar(32) DEFAULT NULL,
   `attriName2` varchar(32) DEFAULT NULL,
   `attriName3` varchar(32) DEFAULT NULL,
   `attriName4` varchar(32) DEFAULT NULL,
   `comment` int DEFAULT NULL,
   `variety` int DEFAULT NULL,
   PRIMARY KEY (`id`),
   FULLTEXT KEY `name` (`name`) /*!50100 WITH PARSER `ngram` */ 
 );

 CREATE TABLE `product_img` (
   `id` int NOT NULL AUTO_INCREMENT,
   `product_id` int NOT NULL,
   `image_url` varchar(255) DEFAULT NULL,
   PRIMARY KEY (`id`),
   KEY `product_img_ibfk_1` (`product_id`),
   CONSTRAINT `product_img_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
 ) ;


 CREATE TABLE `product_mode` (
   `id` int NOT NULL AUTO_INCREMENT,
   `product_id` int NOT NULL,
   `name` varchar(255) DEFAULT '',
   PRIMARY KEY (`id`),
   KEY `product_mode_ibfk_1` (`product_id`),
   CONSTRAINT `product_mode_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
 ) ;

 CREATE TABLE `product_name` (
   `id` int NOT NULL AUTO_INCREMENT,
   `product_id` int NOT NULL,
   `name` varchar(255) DEFAULT '',
   `image_url` varchar(255) DEFAULT NULL,
   PRIMARY KEY (`id`),
   KEY `product_name_ibfk_1` (`product_id`),
   CONSTRAINT `product_name_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
 ) ;

 CREATE TABLE `product_price_history` (
   `id` int NOT NULL AUTO_INCREMENT,
   `product_id` int NOT NULL,
   `price` decimal(10,2) NOT NULL,
   `price_date` date NOT NULL,
   PRIMARY KEY (`id`),
   UNIQUE KEY `product_id` (`product_id`,`price_date`),
   CONSTRAINT `product_price_history_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
 );


 CREATE TABLE `product_size` (
   `id` int NOT NULL AUTO_INCREMENT,
   `product_id` int NOT NULL,
   `name` varchar(255) DEFAULT '',
   PRIMARY KEY (`id`),
   KEY `product_size_ibfk_1` (`product_id`),
   CONSTRAINT `product_size_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
 ) ;

 CREATE TABLE `product_type` (
   `id` int NOT NULL AUTO_INCREMENT,
   `product_id` int NOT NULL,
   `name` varchar(255) DEFAULT '',
   PRIMARY KEY (`id`),
   KEY `product_type_ibfk_1` (`product_id`),
   CONSTRAINT `product_type_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
 );

 CREATE TABLE `user_price_drop_alerts` (
   `id` int NOT NULL AUTO_INCREMENT,
   `user_id` int NOT NULL,
   `product_name` varchar(255) NOT NULL,
   `product_url` varchar(255) NOT NULL,
   `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY (`id`),
   KEY `user_id` (`user_id`),
   CONSTRAINT `user_price_drop_alerts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
 );

 CREATE TABLE `user_product_favourites` (
   `id` int NOT NULL AUTO_INCREMENT,
   `user_id` int NOT NULL,
   `product_id` int NOT NULL,
   PRIMARY KEY (`id`),
   UNIQUE KEY `user_id` (`user_id`,`product_id`),
   KEY `product_id` (`product_id`),
   CONSTRAINT `user_product_favourites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
   CONSTRAINT `user_product_favourites_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
 ) ;

 CREATE TABLE `user_product_scales` (
   `id` int NOT NULL AUTO_INCREMENT,
   `user_id` int NOT NULL,
   `product_id` int NOT NULL,
   `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY (`id`),
   UNIQUE KEY `user_id` (`user_id`,`product_id`),
   KEY `product_id` (`product_id`),
   CONSTRAINT `user_product_scales_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
   CONSTRAINT `user_product_scales_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
 );

 CREATE TABLE `user_system_messages` (
   `id` int NOT NULL AUTO_INCREMENT,
   `user_id` int NOT NULL,
   `title` varchar(255) NOT NULL,
   `body` text NOT NULL,
   `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY (`id`),
   KEY `user_id` (`user_id`),
   CONSTRAINT `user_system_messages_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
 ) ;