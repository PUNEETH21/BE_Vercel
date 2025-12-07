const express = require('express');
const { body, validationResult } = require('express-validator');
const PreventiveCare = require('../models/PreventiveCare');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/preventive-care
// @desc    Get all preventive care records
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { careType, status, patient, priority } = req.query;
    const query = {};

    // Patients can only see their own records
    if (req.user.role === 'patient') {
      query.patient = req.user.id;
    } else if (req.user.role === 'doctor') {
      if (patient) {
        query.patient = patient;
      }
    }

    if (careType) query.careType = careType;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const preventiveCare = await PreventiveCare.find(query)
      .populate('patient', 'name email phone')
      .populate('assignedBy', 'name')
      .sort({ scheduledDate: -1 });

    res.json({
      success: true,
      count: preventiveCare.length,
      data: preventiveCare
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/preventive-care/:id
// @desc    Get single preventive care record
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const preventiveCare = await PreventiveCare.findById(req.params.id)
      .populate('patient', 'name email phone')
      .populate('assignedBy', 'name');

    if (!preventiveCare) {
      return res.status(404).json({
        success: false,
        message: 'Preventive care record not found'
      });
    }

    // Check authorization
    if (req.user.role === 'patient' && preventiveCare.patient._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this record'
      });
    }

    res.json({
      success: true,
      data: preventiveCare
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/preventive-care
// @desc    Create new preventive care record
// @access  Private/Doctor/Admin
router.post('/', authorize('doctor', 'admin'), [
  body('patient').notEmpty().withMessage('Patient is required'),
  body('careType').isIn(['vaccination', 'screening', 'health-check', 'wellness-program', 'health-education']).withMessage('Invalid care type'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('scheduledDate').notEmpty().withMessage('Scheduled date is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('frequency').optional().isIn(['one-time', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const preventiveCare = await PreventiveCare.create({
      ...req.body,
      assignedBy: req.user.id
    });

    const populatedRecord = await PreventiveCare.findById(preventiveCare._id)
      .populate('patient', 'name email phone')
      .populate('assignedBy', 'name');

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

// @route   PUT /api/preventive-care/:id
// @desc    Update preventive care record
// @access  Private
router.put('/:id', [
  body('status').optional().isIn(['scheduled', 'completed', 'overdue', 'cancelled']),
  body('priority').optional().isIn(['low', 'medium', 'high'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const preventiveCare = await PreventiveCare.findById(req.params.id);

    if (!preventiveCare) {
      return res.status(404).json({
        success: false,
        message: 'Preventive care record not found'
      });
    }

    // Patients can only update status to completed
    if (req.user.role === 'patient' && preventiveCare.patient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this record'
      });
    }

    // If status is being updated to completed, set completedDate
    if (req.body.status === 'completed' && !preventiveCare.completedDate) {
      req.body.completedDate = new Date();
    }

    const updatedRecord = await PreventiveCare.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    )
      .populate('patient', 'name email phone')
      .populate('assignedBy', 'name');

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

// @route   DELETE /api/preventive-care/:id
// @desc    Delete preventive care record
// @access  Private/Admin
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const preventiveCare = await PreventiveCare.findById(req.params.id);

    if (!preventiveCare) {
      return res.status(404).json({
        success: false,
        message: 'Preventive care record not found'
      });
    }

    await PreventiveCare.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Preventive care record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

