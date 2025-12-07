const express = require('express');
const { body, validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/patients
// @desc    Get all patients
// @access  Private/Doctor/Admin
router.get('/', authorize('doctor', 'admin'), async (req, res) => {
  try {
    const patients = await Patient.find()
      .populate('userId', 'name email phone dateOfBirth')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/patients/me
// @desc    Get current user's patient profile
// @access  Private
router.get('/me', async (req, res) => {
  try {
    let patient = await Patient.findOne({ userId: req.user.id })
      .populate('userId', 'name email phone dateOfBirth address');

    if (!patient) {
      // Create patient profile if doesn't exist
      patient = await Patient.create({ userId: req.user.id });
    }

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/patients/:id
// @desc    Get single patient
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('userId', 'name email phone dateOfBirth address');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user.role !== 'doctor' && 
        patient.userId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this patient'
      });
    }

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/patients
// @desc    Create patient profile
// @access  Private
router.post('/', [
  body('bloodGroup').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if patient profile already exists
    const existingPatient = await Patient.findOne({ userId: req.user.id });
    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: 'Patient profile already exists'
      });
    }

    const patient = await Patient.create({
      userId: req.user.id,
      ...req.body
    });

    res.status(201).json({
      success: true,
      data: patient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/patients/:id
// @desc    Update patient profile
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user.role !== 'doctor' && 
        patient.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this patient'
      });
    }

    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone');

    res.json({
      success: true,
      data: updatedPatient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

