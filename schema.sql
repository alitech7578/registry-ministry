
-- Database Schema for Ministry Digital File Transfer System

CREATE DATABASE IF NOT EXISTS ministry_workflow;
USE ministry_workflow;

-- Units / Departments Table
CREATE TABLE units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    unit_id INT,
    role ENUM('Staff', 'Supervisor', 'Director', 'Admin') DEFAULT 'Staff',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id)
);

-- Files Table
CREATE TABLE files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ref_no VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    attachment_path VARCHAR(255),
    creator_id INT,
    current_holder_id INT,
    status ENUM('Pending', 'Acknowledged', 'In Review', 'Approved', 'Returned', 'Completed') DEFAULT 'Pending',
    unit_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id),
    FOREIGN KEY (current_holder_id) REFERENCES users(id),
    FOREIGN KEY (unit_id) REFERENCES units(id)
);

-- File Transfer Log Table
CREATE TABLE file_transfers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_id INT,
    from_user_id INT,
    to_user_id INT,
    comment TEXT NOT NULL,
    status_at_transfer VARCHAR(50),
    transferred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id),
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id)
);

-- Acknowledgments Table (Sub-tracking for accountability)
CREATE TABLE acknowledgements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_id INT,
    user_id INT,
    acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Audit / Activity Logs Table
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    target_table VARCHAR(50),
    target_id INT,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Notifications Table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Sample Data Seeding
INSERT INTO units (name) VALUES ('Information Technology'), ('Human Resources'), ('Finance'), ('Procurement');

-- Note: In production, passwords would be bcrypt hashed
INSERT INTO users (staff_id, name, email, password_hash, unit_id, role) 
VALUES ('ADM-001', 'Admin User', 'admin@ministry.gov', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 'Admin');
