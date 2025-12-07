const express = require('express');
const { body, validationResult } = require('express-validator');
const HealthRecord = require('../models/HealthRecord');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/health-records
// @desc    Get all health records
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { recordType, patient, startDate, endDate } = req.query;
    const query = {};

    // Patients can only see their own records
    if (req.user.role === 'patient') {
      query.patient = req.user.id;
    } else if (req.user.role === 'doctor') {
      // Doctors can see records of their patients
      if (patient) {
        query.patient = patient;
      }
    }

    if (recordType) query.recordType = recordType;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const records = await HealthRecord.find(query)
      .populate('patient', 'name email')
      .populate('recordedBy', 'name')
      .sort({ date: -1 });

    res.json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/health-records/:id
// @desc    Get single health record
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const record = await HealthRecord.findById(req.params.id)
      .populate('patient', 'name email')
      .populate('recordedBy', 'name');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Health record not found'
      });
    }

    // Check authorization
    if (req.user.role === 'patient' && record.patient._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this record'
      });
    }

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/health-records
// @desc    Create new health record
// @access  Private/Doctor/Admin
router.post('/', authorize('doctor', 'admin'), [
  body('patient').notEmpty().withMessage('Patient is required'),
  body('recordType').isIn(['vital-signs', 'lab-result', 'imaging', 'vaccination', 'screening', 'other']).withMessage('Invalid record type'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('date').optional().isISO8601().withMessage('Invalid date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const record = await HealthRecord.create({
      ...req.body,
      recordedBy: req.user.id
    });

    const populatedRecord = await HealthRecord.findById(record._id)
      .populate('patient', 'name email')
      .populate('recordedBy', 'name');

    res.status(201).json({
      success: true,
      data: populatedRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/health-records/:id
// @desc    Update health record
// @access  Private/Doctor/Admin
router.put('/:id', authorize('doctor', 'admin'), async (req, res) => {
  try {
    const record = await HealthRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Health record not found'
      });
    }

    const updatedRecord = await HealthRecord.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    )
      .populate('patient', 'name email')
      .populate('recordedBy', 'name');

    res.json({
      success: true,
      data: updatedRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/health-records/:id
// @desc    Delete health record
// @access  Private/Admin
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const record = await HealthRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Health record not found'
      });
    }

    await HealthRecord.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Health record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

