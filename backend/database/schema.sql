-- ============================================================
-- Hospital Appointment System
-- MySQL Database Script | Semester Project
-- ============================================================

DROP DATABASE IF EXISTS hospital_db;
CREATE DATABASE hospital_db;
USE hospital_db;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE departments (
    dept_id     INT          AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE doctors (
    doctor_id      INT          AUTO_INCREMENT PRIMARY KEY,
    full_name      VARCHAR(150) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    phone          VARCHAR(20)  NOT NULL UNIQUE,
    email          VARCHAR(150) NOT NULL UNIQUE,
    dept_id        INT          NOT NULL,
    FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE patients (
    patient_id        INT          AUTO_INCREMENT PRIMARY KEY,
    full_name         VARCHAR(150) NOT NULL,
    dob               DATE         NOT NULL,
    gender            ENUM('Male','Female','Other') NOT NULL,
    phone             VARCHAR(20)  NOT NULL UNIQUE,
    email             VARCHAR(150) NOT NULL UNIQUE,
    registration_date DATE         NOT NULL DEFAULT (CURDATE())
);

CREATE TABLE appointments (
    appointment_id     INT      AUTO_INCREMENT PRIMARY KEY,
    patient_id         INT      NOT NULL,
    doctor_id          INT      NOT NULL,
    scheduled_datetime DATETIME NOT NULL,
    status             ENUM('Scheduled','Completed','Cancelled') NOT NULL DEFAULT 'Scheduled',
    notes              TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE RESTRICT,
    FOREIGN KEY (doctor_id)  REFERENCES doctors(doctor_id)   ON DELETE RESTRICT
);

CREATE TABLE prescriptions (
    prescription_id INT  AUTO_INCREMENT PRIMARY KEY,
    appointment_id  INT  NOT NULL UNIQUE,
    issue_date      DATE NOT NULL DEFAULT (CURDATE()),
    doctor_notes    TEXT,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE RESTRICT
);

CREATE TABLE medications (
    medication_id   INT          AUTO_INCREMENT PRIMARY KEY,
    prescription_id INT          NOT NULL,
    name            VARCHAR(150) NOT NULL,
    dosage          VARCHAR(100) NOT NULL,
    frequency       VARCHAR(100) NOT NULL,
    duration        VARCHAR(100) NOT NULL,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id) ON DELETE CASCADE
);

-- Audit table: tracks every appointment status change
CREATE TABLE appointment_audit (
    audit_id       INT       AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT       NOT NULL,
    old_status     ENUM('Scheduled','Completed','Cancelled'),
    new_status     ENUM('Scheduled','Completed','Cancelled') NOT NULL,
    changed_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE
);

-- Log table: records when a new patient registers
CREATE TABLE patient_activity_log (
    log_id        INT       AUTO_INCREMENT PRIMARY KEY,
    patient_id    INT       NOT NULL,
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
);

-- ============================================================
-- VIEWS
-- ============================================================

-- Full appointment summary with patient, doctor, and department
CREATE VIEW vw_appointment_details AS
SELECT
    a.appointment_id,
    p.full_name         AS patient_name,
    d.full_name         AS doctor_name,
    dep.name            AS department,
    a.scheduled_datetime,
    a.status
FROM appointments a
JOIN patients    p   ON a.patient_id = p.patient_id
JOIN doctors     d   ON a.doctor_id  = d.doctor_id
JOIN departments dep ON d.dept_id    = dep.dept_id;

-- How many distinct patients each doctor has seen (completed only)
CREATE VIEW vw_doctor_patient_count AS
SELECT
    d.full_name  AS doctor_name,
    dep.name     AS department,
    COUNT(DISTINCT a.patient_id) AS total_patients
FROM doctors d
JOIN departments dep ON d.dept_id = dep.dept_id
LEFT JOIN appointments a ON a.doctor_id = d.doctor_id AND a.status = 'Completed'
GROUP BY d.doctor_id, d.full_name, dep.name;

-- Patient appointment history with prescription info where available
CREATE VIEW vw_patient_history AS
SELECT
    p.full_name          AS patient_name,
    a.scheduled_datetime,
    a.status,
    d.full_name          AS doctor_name,
    pr.issue_date        AS prescription_date,
    pr.doctor_notes
FROM patients p
JOIN appointments   a  ON a.patient_id    = p.patient_id
JOIN doctors        d  ON a.doctor_id     = d.doctor_id
LEFT JOIN prescriptions pr ON pr.appointment_id = a.appointment_id;

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

DELIMITER $$

-- Book a new appointment with basic validation
CREATE PROCEDURE sp_book_appointment(
    IN p_patient_id INT,
    IN p_doctor_id  INT,
    IN p_datetime   DATETIME,
    IN p_notes      TEXT
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM patients WHERE patient_id = p_patient_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Patient not found.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM doctors WHERE doctor_id = p_doctor_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Doctor not found.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM appointments
        WHERE patient_id = p_patient_id AND doctor_id = p_doctor_id
          AND scheduled_datetime = p_datetime AND status = 'Scheduled'
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Duplicate appointment.';
    END IF;

    INSERT INTO appointments (patient_id, doctor_id, scheduled_datetime, notes)
    VALUES (p_patient_id, p_doctor_id, p_datetime, p_notes);
END$$

-- Cancel an appointment by ID
CREATE PROCEDURE sp_cancel_appointment(IN p_appointment_id INT)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM appointments WHERE appointment_id = p_appointment_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Appointment not found.';
    END IF;

    UPDATE appointments SET status = 'Cancelled' WHERE appointment_id = p_appointment_id;
END$$

-- Get all appointments for a doctor on a given date
CREATE PROCEDURE sp_get_doctor_schedule(IN p_doctor_id INT, IN p_date DATE)
BEGIN
    SELECT a.appointment_id, p.full_name AS patient_name, a.scheduled_datetime, a.status, a.notes
    FROM appointments a
    JOIN patients p ON a.patient_id = p.patient_id
    WHERE a.doctor_id = p_doctor_id AND DATE(a.scheduled_datetime) = p_date
    ORDER BY a.scheduled_datetime;
END$$

DELIMITER ;

-- ============================================================
-- TRIGGERS
-- ============================================================

DELIMITER $$

-- Log every appointment status change
CREATE TRIGGER trg_appointment_audit
AFTER UPDATE ON appointments
FOR EACH ROW
BEGIN
    IF OLD.status <> NEW.status THEN
        INSERT INTO appointment_audit (appointment_id, old_status, new_status)
        VALUES (NEW.appointment_id, OLD.status, NEW.status);
    END IF;
END$$

-- Log every new patient registration
CREATE TRIGGER trg_patient_log
AFTER INSERT ON patients
FOR EACH ROW
BEGIN
    INSERT INTO patient_activity_log (patient_id) VALUES (NEW.patient_id);
END$$

DELIMITER ;

-- ============================================================
-- DATABASE USERS (Least-Privilege Security)
-- ============================================================

DROP USER IF EXISTS 'has_admin'@'localhost';
DROP USER IF EXISTS 'has_doctor'@'localhost';
DROP USER IF EXISTS 'has_receptionist'@'localhost';
DROP USER IF EXISTS 'has_readonly'@'localhost';

-- Admin: full access
CREATE USER 'has_admin'@'localhost' IDENTIFIED BY 'Admin@H0sp1tal!';
GRANT ALL PRIVILEGES ON hospital_db.* TO 'has_admin'@'localhost';

-- Doctor: read patients/appointments, write prescriptions, run schedule lookup
CREATE USER 'has_doctor'@'localhost' IDENTIFIED BY 'D0ct0r@H0sp1tal!';
GRANT SELECT ON hospital_db.patients      TO 'has_doctor'@'localhost';
GRANT SELECT ON hospital_db.appointments  TO 'has_doctor'@'localhost';
GRANT SELECT, INSERT, UPDATE ON hospital_db.prescriptions TO 'has_doctor'@'localhost';
GRANT SELECT, INSERT, UPDATE ON hospital_db.medications   TO 'has_doctor'@'localhost';
GRANT EXECUTE ON PROCEDURE hospital_db.sp_get_doctor_schedule TO 'has_doctor'@'localhost';

-- Receptionist: read reference data, book/cancel appointments via procedures only
CREATE USER 'has_receptionist'@'localhost' IDENTIFIED BY 'R3cept@H0sp1tal!';
GRANT SELECT ON hospital_db.doctors      TO 'has_receptionist'@'localhost';
GRANT SELECT ON hospital_db.departments  TO 'has_receptionist'@'localhost';
GRANT SELECT ON hospital_db.appointments TO 'has_receptionist'@'localhost';
GRANT EXECUTE ON PROCEDURE hospital_db.sp_book_appointment   TO 'has_receptionist'@'localhost';
GRANT EXECUTE ON PROCEDURE hospital_db.sp_cancel_appointment TO 'has_receptionist'@'localhost';

-- Read-only: views only, no raw table access
CREATE USER 'has_readonly'@'localhost' IDENTIFIED BY 'R3adOnly@H0sp1tal!';
GRANT SELECT ON hospital_db.vw_appointment_details  TO 'has_readonly'@'localhost';
GRANT SELECT ON hospital_db.vw_doctor_patient_count TO 'has_readonly'@'localhost';
GRANT SELECT ON hospital_db.vw_patient_history      TO 'has_readonly'@'localhost';

FLUSH PRIVILEGES;

-- ============================================================
-- SAMPLE DATA
-- ============================================================

INSERT INTO departments (name, description) VALUES
    ('Cardiology',       'Heart and cardiovascular diseases'),
    ('Orthopedics',      'Musculoskeletal disorders'),
    ('General Medicine', 'Primary care consultations');

INSERT INTO doctors (full_name, specialization, phone, email, dept_id) VALUES
    ('Dr. Sarah Mitchell', 'Cardiologist',       '555-0101', 'sarah@hospital.com', 1),
    ('Dr. Priya Sharma',   'Orthopedic Surgeon', '555-0201', 'priya@hospital.com', 2),
    ('Dr. Linda Kowalski', 'General Practitioner','555-0301', 'linda@hospital.com', 3);

INSERT INTO patients (full_name, dob, gender, phone, email) VALUES
    ('Alice Johnson',  '1990-03-15', 'Female', '555-1001', 'alice@email.com'),
    ('Bob Williams',   '1985-07-22', 'Male',   '555-1002', 'bob@email.com'),
    ('Carol Davis',    '1978-11-08', 'Female', '555-1003', 'carol@email.com'),
    ('David Martinez', '1995-01-30', 'Male',   '555-1004', 'david@email.com'),
    ('Eva Brown',      '2000-06-14', 'Female', '555-1005', 'eva@email.com');

INSERT INTO appointments (patient_id, doctor_id, scheduled_datetime, status, notes) VALUES
    (1, 1, '2024-11-01 09:00:00', 'Completed',  'Routine cardiac checkup'),
    (2, 1, '2024-11-01 10:00:00', 'Completed',  'Follow-up after ECG'),
    (3, 2, '2024-11-04 09:30:00', 'Completed',  'Knee pain assessment'),
    (4, 2, '2024-11-05 10:00:00', 'Cancelled',  'Patient rescheduled'),
    (5, 3, '2024-11-09 10:00:00', 'Completed',  'Annual physical exam'),
    (1, 3, '2024-11-09 11:00:00', 'Scheduled',  'Blood pressure monitoring'),
    (2, 3, '2024-11-10 14:00:00', 'Completed',  'Diabetes management');

INSERT INTO prescriptions (appointment_id, doctor_notes) VALUES
    (1, 'Continue current medication. Review in 3 months.'),
    (2, 'Prescribed beta-blocker. Follow-up in 6 weeks.'),
    (3, 'Physiotherapy recommended.'),
    (5, 'All vitals normal.'),
    (7, 'HbA1c improved. Continue metformin.');

INSERT INTO medications (prescription_id, name, dosage, frequency, duration) VALUES
    (1, 'Aspirin',     '81mg',  'Once daily',       '90 days'),
    (1, 'Atorvastatin','20mg',  'Once at night',    '90 days'),
    (2, 'Metoprolol',  '25mg',  'Twice daily',      '42 days'),
    (3, 'Ibuprofen',   '400mg', 'Three times daily','14 days'),
    (5, 'Metformin',   '500mg', 'Twice daily',      '90 days');

-- ============================================================
-- REPORTING QUERIES
-- ============================================================

-- Top doctors by completed appointments
SELECT d.full_name AS doctor, dep.name AS department, COUNT(*) AS completed
FROM doctors d
JOIN departments dep ON d.dept_id = dep.dept_id
JOIN appointments a  ON a.doctor_id = d.doctor_id
WHERE a.status = 'Completed'
GROUP BY d.doctor_id, d.full_name, dep.name
ORDER BY completed DESC
LIMIT 5;

-- Appointment count per department grouped by status
SELECT dep.name AS department, a.status, COUNT(*) AS total
FROM departments dep
JOIN doctors      d ON d.dept_id   = dep.dept_id
JOIN appointments a ON a.doctor_id = d.doctor_id
GROUP BY dep.name, a.status
ORDER BY dep.name, a.status;

-- Patients with more than 3 completed appointments
SELECT p.full_name AS patient, COUNT(*) AS completed
FROM patients p
JOIN appointments a ON a.patient_id = p.patient_id
WHERE a.status = 'Completed'
GROUP BY p.patient_id, p.full_name
HAVING COUNT(*) > 3;
