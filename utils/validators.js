const { body } = require('express-validator');

// User validation rules
exports.validateUser = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('phone')
    .optional()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .withMessage('Please provide a valid phone number')
];

// Appointment validation rules
exports.validateAppointment = [
  body('doctor')
    .notEmpty()
    .withMessage('Doctor is required')
    .isMongoId()
    .withMessage('Invalid doctor ID'),
  body('appointmentDate')
    .notEmpty()
    .withMessage('Appointment date is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Appointment date cannot be in the past');
      }
      return true;
    }),
  body('appointmentTime')
    .notEmpty()
    .withMessage('Appointment time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format (use HH:MM)'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
  body('type')
    .optional()
    .isIn(['consultation', 'follow-up', 'checkup', 'emergency', 'preventive'])
    .withMessage('Invalid appointment type'),
  body('duration')
    .optional()
    .isInt({ min: 15, max: 240 })
    .withMessage('Duration must be between 15 and 240 minutes')
];

// Health record validation rules
exports.validateHealthRecord = [
  body('patient')
    .notEmpty()
    .withMessage('Patient is required')
    .isMongoId()
    .withMessage('Invalid patient ID'),
  body('recordType')
    .isIn(['vital-signs', 'lab-result', 'imaging', 'vaccination', 'screening', 'other'])
    .withMessage('Invalid record type'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('vitalSigns.bloodPressure.systolic')
    .optional()
    .isInt({ min: 50, max: 250 })
    .withMessage('Systolic pressure must be between 50 and 250'),
  body('vitalSigns.bloodPressure.diastolic')
    .optional()
    .isInt({ min: 30, max: 150 })
    .withMessage('Diastolic pressure must be between 30 and 150'),
  body('vitalSigns.heartRate')
    .optional()
    .isInt({ min: 30, max: 220 })
    .withMessage('Heart rate must be between 30 and 220 bpm')
];

// Preventive care validation rules
exports.validatePreventiveCare = [
  body('patient')
    .notEmpty()
    .withMessage('Patient is required')
    .isMongoId()
    .withMessage('Invalid patient ID'),
  body('careType')
    .isIn(['vaccination', 'screening', 'health-check', 'wellness-program', 'health-education'])
    .withMessage('Invalid care type'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('scheduledDate')
    .notEmpty()
    .withMessage('Scheduled date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority level'),
  body('frequency')
    .optional()
    .isIn(['one-time', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'])
    .withMessage('Invalid frequency')
];

