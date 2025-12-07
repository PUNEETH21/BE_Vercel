const express = require('express');
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/appointments
// @desc    Get all appointments
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { status, type, patient, doctor, startDate, endDate } = req.query;
    const query = {};

    // Patients can only see their own appointments
    if (req.user.role === 'patient') {
      query.patient = req.user.id;
    } else if (req.user.role === 'doctor') {
      query.doctor = req.user.id;
    }

    if (status) query.status = status;
    if (type) query.type = type;
    if (patient && (req.user.role === 'admin' || req.user.role === 'doctor')) {
      query.patient = patient;
    }
    if (doctor && req.user.role === 'admin') {
      query.doctor = doctor;
    }
    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) query.appointmentDate.$gte = new Date(startDate);
      if (endDate) query.appointmentDate.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email')
      .sort({ appointmentDate: -1, appointmentTime: -1 });

    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/appointments/:id
// @desc    Get single appointment
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    if (req.user.role === 'patient' && appointment.patient._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this appointment'
      });
    }

    if (req.user.role === 'doctor' && appointment.doctor._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this appointment'
      });
    }

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/appointments
// @desc    Create new appointment
// @access  Private
router.post('/', [
  body('doctor').notEmpty().withMessage('Doctor is required'),
  body('appointmentDate').notEmpty().withMessage('Appointment date is required'),
  body('appointmentTime').notEmpty().withMessage('Appointment time is required'),
  body('reason').trim().notEmpty().withMessage('Reason is required'),
  body('type').optional().isIn(['consultation', 'follow-up', 'checkup', 'emergency', 'preventive'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const appointment = await Appointment.create({
      patient: req.user.role === 'patient' ? req.user.id : req.body.patient || req.user.id,
      doctor: req.body.doctor,
      appointmentDate: req.body.appointmentDate,
      appointmentTime: req.body.appointmentTime,
      duration: req.body.duration || 30,
      type: req.body.type || 'consultation',
      reason: req.body.reason,
      notes: req.body.notes
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email');

    res.status(201).json({
      success: true,
      data: populatedAppointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/appointments/:id
// @desc    Update appointment
// @access  Private
router.put('/:id', [
  body('status').optional().isIn(['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show']),
  body('type').optional().isIn(['consultation', 'follow-up', 'checkup', 'emergency', 'preventive'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this appointment'
      });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    )
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email');

    res.json({
      success: true,
      data: updatedAppointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/appointments/:id
// @desc    Cancel appointment
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this appointment'
      });
    }

    // Soft delete by changing status
    appointment.status = 'cancelled';
    appointment.updatedAt = Date.now();
    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

