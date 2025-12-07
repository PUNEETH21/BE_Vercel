const express = require('express');
const Appointment = require('../models/Appointment');
const HealthRecord = require('../models/HealthRecord');
const PreventiveCare = require('../models/PreventiveCare');
const Patient = require('../models/Patient');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard statistics
// @access  Private
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = {};
    if (userRole === 'patient') {
      query.patient = userId;
    } else if (userRole === 'doctor') {
      query.doctor = userId;
    }

    // Get appointment statistics
    const totalAppointments = await Appointment.countDocuments(query);
    const upcomingAppointments = await Appointment.countDocuments({
      ...query,
      appointmentDate: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] }
    });
    const completedAppointments = await Appointment.countDocuments({
      ...query,
      status: 'completed'
    });

    // Get health records statistics
    const healthRecordsQuery = userRole === 'patient' ? { patient: userId } : {};
    const totalHealthRecords = await HealthRecord.countDocuments(healthRecordsQuery);
    const recentHealthRecords = await HealthRecord.countDocuments({
      ...healthRecordsQuery,
      date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });

    // Get preventive care statistics
    const preventiveCareQuery = userRole === 'patient' ? { patient: userId } : {};
    const totalPreventiveCare = await PreventiveCare.countDocuments(preventiveCareQuery);
    const overduePreventiveCare = await PreventiveCare.countDocuments({
      ...preventiveCareQuery,
      scheduledDate: { $lt: new Date() },
      status: { $in: ['scheduled'] }
    });
    const completedPreventiveCare = await PreventiveCare.countDocuments({
      ...preventiveCareQuery,
      status: 'completed'
    });

    // Get appointments by status
    const appointmentsByStatus = await Appointment.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get appointments by type
    const appointmentsByType = await Appointment.aggregate([
      { $match: query },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Get health records by type
    const healthRecordsByType = await HealthRecord.aggregate([
      { $match: healthRecordsQuery },
      { $group: { _id: '$recordType', count: { $sum: 1 } } }
    ]);

    // Get preventive care by type
    const preventiveCareByType = await PreventiveCare.aggregate([
      { $match: preventiveCareQuery },
      { $group: { _id: '$careType', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        appointments: {
          total: totalAppointments,
          upcoming: upcomingAppointments,
          completed: completedAppointments,
          byStatus: appointmentsByStatus,
          byType: appointmentsByType
        },
        healthRecords: {
          total: totalHealthRecords,
          recent: recentHealthRecords,
          byType: healthRecordsByType
        },
        preventiveCare: {
          total: totalPreventiveCare,
          overdue: overduePreventiveCare,
          completed: completedPreventiveCare,
          byType: preventiveCareByType
        }
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/analytics/health-trends
// @desc    Get health trends over time
// @access  Private
router.get('/health-trends', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    const query = {
      recordType: 'vital-signs',
      date: {}
    };

    if (userRole === 'patient') {
      query.patient = userId;
    }

    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);

    const healthRecords = await HealthRecord.find(query)
      .select('date vitalSigns')
      .sort({ date: 1 })
      .limit(100);

    const trends = healthRecords.map(record => ({
      date: record.date,
      bloodPressure: record.vitalSigns?.bloodPressure,
      heartRate: record.vitalSigns?.heartRate,
      temperature: record.vitalSigns?.temperature,
      weight: record.vitalSigns?.weight
    }));

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

