CREATE DATABASE IF NOT EXISTS volunteer_portal;

USE volunteer_portal;

-- =====================================================
-- USERS
-- =====================================================
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('VOLUNTEER', 'ORGANIZATION', 'ADMIN') NOT NULL,
    phone VARCHAR(20),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- VOLUNTEER PROFILES
-- =====================================================
CREATE TABLE volunteer_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    skills TEXT,
    interests TEXT,
    location VARCHAR(255),
    bio TEXT,
    availability VARCHAR(255),
    profile_image VARCHAR(500),

    CONSTRAINT fk_volunteer_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =====================================================
-- ORGANIZATION PROFILES
-- =====================================================
CREATE TABLE organization_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    organization_name VARCHAR(200) NOT NULL,
    description TEXT,
    address VARCHAR(500),
    website VARCHAR(500),
    contact_email VARCHAR(150),
    verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED')
        NOT NULL DEFAULT 'PENDING',

    CONSTRAINT fk_organization_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =====================================================
-- CATEGORIES
-- =====================================================
CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- =====================================================
-- OPPORTUNITIES
-- =====================================================
CREATE TABLE opportunities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id BIGINT NOT NULL,
    category_id BIGINT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255),
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    required_volunteers INT NOT NULL,
    status ENUM('DRAFT', 'OPEN', 'CLOSED', 'COMPLETED', 'CANCELLED')
        NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_opportunity_organization
        FOREIGN KEY (organization_id)
        REFERENCES organization_profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_opportunity_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE SET NULL
);

-- =====================================================
-- APPLICATIONS
-- =====================================================
CREATE TABLE applications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    volunteer_id BIGINT NOT NULL,
    opportunity_id BIGINT NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED')
        NOT NULL DEFAULT 'PENDING',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_application_volunteer
        FOREIGN KEY (volunteer_id)
        REFERENCES volunteer_profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_application_opportunity
        FOREIGN KEY (opportunity_id)
        REFERENCES opportunities(id)
        ON DELETE CASCADE,

    CONSTRAINT uk_volunteer_opportunity
        UNIQUE (volunteer_id, opportunity_id)
);

-- =====================================================
-- ATTENDANCE
-- =====================================================
CREATE TABLE attendance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_id BIGINT NOT NULL UNIQUE,
    attendance_date DATE NOT NULL,
    status ENUM('PRESENT', 'ABSENT') NOT NULL,
    check_in_time TIME,
    check_out_time TIME,

    CONSTRAINT fk_attendance_application
        FOREIGN KEY (application_id)
        REFERENCES applications(id)
        ON DELETE CASCADE
);

-- =====================================================
-- CERTIFICATES
-- =====================================================
CREATE TABLE certificates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    volunteer_id BIGINT NOT NULL,
    opportunity_id BIGINT NOT NULL,
    certificate_number VARCHAR(100) NOT NULL UNIQUE,
    issue_date DATE NOT NULL,
    certificate_url VARCHAR(500),

    CONSTRAINT fk_certificate_volunteer
        FOREIGN KEY (volunteer_id)
        REFERENCES volunteer_profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_certificate_opportunity
        FOREIGN KEY (opportunity_id)
        REFERENCES opportunities(id)
        ON DELETE CASCADE
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_users_email
    ON users(email);

CREATE INDEX idx_opportunities_organization
    ON opportunities(organization_id);

CREATE INDEX idx_opportunities_category
    ON opportunities(category_id);

CREATE INDEX idx_opportunities_status
    ON opportunities(status);

CREATE INDEX idx_applications_volunteer
    ON applications(volunteer_id);

CREATE INDEX idx_applications_opportunity
    ON applications(opportunity_id);

CREATE INDEX idx_notifications_user
    ON notifications(user_id);

CREATE INDEX idx_notifications_read
    ON notifications(is_read);