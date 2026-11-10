-- Apply to the existing MySQL database before deploying the hardened API.
-- Do not commit production database exports or plaintext passwords.
CREATE TABLE IF NOT EXISTS student_credentials (
  roll_no VARCHAR(20) NOT NULL PRIMARY KEY,
  password_hash VARCHAR(255) NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_student_credentials_student FOREIGN KEY (roll_no) REFERENCES students(roll_no) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  role ENUM('student', 'admin') NOT NULL,
  subject VARCHAR(60) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME DEFAULT NULL,
  KEY idx_auth_sessions_expiry (expires_at)
);
