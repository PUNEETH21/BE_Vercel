const express = require('express');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const HealthRecord = require('../models/HealthRecord');
const PreventiveCare = require('../models/PreventiveCare');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/search
// @desc    Global search across all entities
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { q, type } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const searchQuery = { $regex: q, $options: 'i' };
    const results = {
      users: [],
      appointments: [],
      healthRecords: [],
      preventiveCare: []
    };

    // Search users (Admin/Doctor only)
    if (!type || type === 'users') {
      if (req.user.role === 'admin' || req.user.role === 'doctor') {
        const users = await User.find({
          $or: [
            { name: searchQuery },
            { email: searchQuery }
          ]
        })
          .select('name email role phone')
          .limit(10);
        results.users = users;
      }
    }

    // Search appointments
    if (!type || type === 'appointments') {
      const appointmentQuery = {};
      if (req.user.role === 'patient') {
        appointmentQuery.patient = req.user.id;
      } else if (req.user.role === 'doctor') {
        appointmentQuery.doctor = req.user.id;
      }

      const appointments = await Appointment.find({
        ...appointmentQuery,
        $or: [
          { reason: searchQuery },
          { notes: searchQuery },
          { diagnosis: searchQuery }
        ]
      })
        .populate('patient', 'name email')
        .populate('doctor', 'name email')
        .limit(10);
      results.appointments = appointments;
    }

    // Search health records
    if (!type || type === 'healthRecords') {
      const recordQuery = {};
      if (req.user.role === 'patient') {
        recordQuery.patient = req.user.id;
      }

      const healthRecords = await HealthRecord.find({
        ...recordQuery,
        $or: [
          { title: searchQuery },
          { notes: searchQuery },
          { 'labResults.testName': searchQuery }
        ]
      })
        .populate('patient', 'name email')
        .limit(10);
      results.healthRecords = healthRecords;
    }

    // Search preventive care
    if (!type || type === 'preventiveCare') {
      const careQuery = {};
      if (req.user.role === 'patient') {
        careQuery.patient = req.user.id;
      }

      const preventiveCare = await PreventiveCare.find({
        ...careQuery,
        $or: [
          { title: searchQuery },
          { description: searchQuery },
          { notes: searchQuery }
        ]
      })
        .populate('patient', 'name email')
        .limit(10);
      results.preventiveCare = preventiveCare;
    }

    const totalResults = 
      results.users.length +
      results.appointments.length +
      results.healthRecords.length +
      results.preventiveCare.length;

    res.json({
      success: true,
      query: q,
      totalResults,
      results
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

