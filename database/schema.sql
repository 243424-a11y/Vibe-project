-- =====================================================
-- V.I.B.E DATABASE SCHEMA
-- Real-Time Auction Platform
-- =====================================================

-- Create database
CREATE DATABASE IF NOT EXISTS vibe_db;
USE vibe_db;

-- =====================================================
-- TABLE 1: USERS
-- =====================================================
CREATE TABLE IF NOT EXISTS Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_image_url VARCHAR(500),
    bio TEXT,
    role ENUM('buyer', 'seller', 'admin') DEFAULT 'buyer',
    seller_rating DECIMAL(3,2) DEFAULT 0.00,
    total_auctions_sold INT DEFAULT 0,
    total_auctions_won INT DEFAULT 0,
    account_balance DECIMAL(10,2) DEFAULT 0.00,
    is_verified BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE,
    fraud_score DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    last_ip_address VARCHAR(45),
    device_fingerprint VARCHAR(255),
    
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_is_blocked (is_blocked),
    INDEX idx_fraud_score (fraud_score),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 2: AUCTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS Auctions (
    auction_id INT PRIMARY KEY AUTO_INCREMENT,
    seller_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    primary_image_url VARCHAR(500) NOT NULL,
    additional_images JSON,
    starting_price DECIMAL(10,2) NOT NULL,
    current_price DECIMAL(10,2) NOT NULL,
    reserve_price DECIMAL(10,2),
    highest_bidder_id INT,
    bid_count INT DEFAULT 0,
    status ENUM('pending', 'active', 'closed', 'sold', 'unsold') DEFAULT 'pending',
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_featured BOOLEAN DEFAULT FALSE,
    views_count INT DEFAULT 0,
    
    FOREIGN KEY (seller_id) REFERENCES Users(user_id),
    FOREIGN KEY (highest_bidder_id) REFERENCES Users(user_id),
    INDEX idx_status (status),
    INDEX idx_end_time (end_time),
    INDEX idx_seller_id (seller_id),
    INDEX idx_category (category),
    INDEX idx_current_price (current_price),
    INDEX idx_created_at (created_at),
    INDEX idx_composite (status, end_time, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 3: BIDS (Real-Time Critical)
-- =====================================================
CREATE TABLE IF NOT EXISTS Bids (
    bid_id INT PRIMARY KEY AUTO_INCREMENT,
    auction_id INT NOT NULL,
    user_id INT NOT NULL,
    bid_amount DECIMAL(10,2) NOT NULL,
    bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    device_fingerprint VARCHAR(255),
    is_auto_bid BOOLEAN DEFAULT FALSE,
    auto_bid_limit DECIMAL(10,2) DEFAULT NULL,
    is_flagged BOOLEAN DEFAULT FALSE,
    fraud_score DECIMAL(3,2) DEFAULT 0.00,
    
    FOREIGN KEY (auction_id) REFERENCES Auctions(auction_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    INDEX idx_auction_id (auction_id),
    INDEX idx_user_id (user_id),
    INDEX idx_bid_time (bid_time),
    INDEX idx_auction_user (auction_id, user_id),
    INDEX idx_composite (auction_id, bid_time DESC),
    CONSTRAINT check_positive_bid CHECK (bid_amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 4: AUTO_BIDS
-- =====================================================
CREATE TABLE IF NOT EXISTS AutoBids (
    auto_bid_id INT PRIMARY KEY AUTO_INCREMENT,
    auction_id INT NOT NULL,
    user_id INT NOT NULL,
    max_bid_limit DECIMAL(10,2) NOT NULL,
    increment_amount DECIMAL(10,2) DEFAULT 5.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (auction_id) REFERENCES Auctions(auction_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    INDEX idx_auction_user (auction_id, user_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 5: FRAUD_LOGS (Real-Time Monitoring)
-- =====================================================
CREATE TABLE IF NOT EXISTS FraudLogs (
    fraud_log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    auction_id INT,
    bid_id INT,
    fraud_type ENUM('shill_bidding', 'bot_behavior', 'rapid_bidding', 'price_manipulation', 'suspicious_pattern') NOT NULL DEFAULT 'suspicious_pattern',
    fraud_confidence DECIMAL(3,2) NOT NULL,
    action_taken ENUM('flagged', 'suspended', 'blocked', 'reviewed') DEFAULT 'flagged',
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INT,
    reason TEXT,
    
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (auction_id) REFERENCES Auctions(auction_id),
    FOREIGN KEY (bid_id) REFERENCES Bids(bid_id),
    FOREIGN KEY (reviewed_by) REFERENCES Users(user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_fraud_type (fraud_type),
    INDEX idx_detected_at (detected_at),
    INDEX idx_action_taken (action_taken)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 6: USER_PREFERENCES (For Recommendations)
-- =====================================================
CREATE TABLE IF NOT EXISTS UserPreferences (
    preference_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    favorite_categories JSON,
    price_range_min DECIMAL(10,2),
    price_range_max DECIMAL(10,2),
    preferred_sellers JSON,
    browsing_history JSON,
    search_history JSON,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 7: NOTIFICATIONS (Real-Time)
-- =====================================================
CREATE TABLE IF NOT EXISTS Notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('outbid', 'auction_ending', 'bid_placed', 'auction_won', 'auction_closed', 'recommended', 'fraud_alert', 'system') NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_auction_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (related_auction_id) REFERENCES Auctions(auction_id),
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 8: LIKES (Auction Likes)
-- =====================================================
CREATE TABLE IF NOT EXISTS Likes (
    like_id INT PRIMARY KEY AUTO_INCREMENT,
    auction_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (auction_id) REFERENCES Auctions(auction_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (auction_id, user_id),
    INDEX idx_auction_id (auction_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 9: CART (User Watchlist / Cart)
-- =====================================================
CREATE TABLE IF NOT EXISTS Cart (
    cart_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    auction_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (auction_id) REFERENCES Auctions(auction_id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_item (user_id, auction_id),
    INDEX idx_user_id (user_id),
    INDEX idx_auction_id (auction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INSERT SAMPLE ADMIN USER
-- password: Admin@123 (bcrypt hash)
-- =====================================================
INSERT INTO Users (username, email, password_hash, role, is_verified, created_at) 
VALUES ('admin', 'admin@vibe.local', '$2a$12$LJ3m4ys3Gzv0S3h0T5F8UOz8P0vR2jN6Q4W8X9Y0Z1A2B3C4D5E6F', 'admin', TRUE, NOW())
ON DUPLICATE KEY UPDATE username = username;

-- =====================================================
-- INSERT SAMPLE SELLER USER
-- password: Seller@123
-- =====================================================
INSERT INTO Users (username, email, password_hash, role, is_verified, created_at) 
VALUES ('seller1', 'seller@vibe.local', '$2a$12$LJ3m4ys3Gzv0S3h0T5F8UOz8P0vR2jN6Q4W8X9Y0Z1A2B3C4D5E6F', 'seller', TRUE, NOW())
ON DUPLICATE KEY UPDATE username = username;

-- =====================================================
-- INSERT SAMPLE BUYER USER
-- password: Buyer@123
-- =====================================================
INSERT INTO Users (username, email, password_hash, role, is_verified, created_at) 
VALUES ('buyer1', 'buyer@vibe.local', '$2a$12$LJ3m4ys3Gzv0S3h0T5F8UOz8P0vR2jN6Q4W8X9Y0Z1A2B3C4D5E6F', 'buyer', TRUE, NOW())
ON DUPLICATE KEY UPDATE username = username;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
