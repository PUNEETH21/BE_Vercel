const express = require('express');
const PreventiveCare = require('../models/PreventiveCare');
const Appointment = require('../models/Appointment');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/reminders
// @desc    Get upcoming reminders for appointments and preventive care
// @access  Private
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get upcoming appointments
    const appointmentQuery = userRole === 'patient' 
      ? { patient: userId } 
      : { doctor: userId };
    
    const upcomingAppointments = await Appointment.find({
      ...appointmentQuery,
      appointmentDate: { $gte: now, $lte: sevenDaysFromNow },
      status: { $in: ['scheduled', 'confirmed'] }
    })
      .populate(userRole === 'patient' ? 'doctor' : 'patient', 'name email phone')
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .limit(10);

    // Get upcoming preventive care
    const preventiveCareQuery = userRole === 'patient' 
      ? { patient: userId } 
      : {};
    
    const upcomingPreventiveCare = await PreventiveCare.find({
      ...preventiveCareQuery,
      scheduledDate: { $gte: now, $lte: sevenDaysFromNow },
      status: { $in: ['scheduled'] }
    })
      .sort({ scheduledDate: 1 })
      .limit(10);

    // Get overdue preventive care
    const overduePreventiveCare = await PreventiveCare.find({
      ...preventiveCareQuery,
      scheduledDate: { $lt: now },
      status: { $in: ['scheduled'] }
    })
      .sort({ scheduledDate: 1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        appointments: upcomingAppointments.map(apt => ({
          id: apt._id,
          type: 'appointment',
          title: `Appointment with ${userRole === 'patient' ? apt.doctor?.name : apt.patient?.name}`,
          date: apt.appointmentDate,
          time: apt.appointmentTime,
          description: apt.reason
        })),
        preventiveCare: upcomingPreventiveCare.map(care => ({
          id: care._id,
          type: 'preventive-care',
          title: care.title,
          date: care.scheduledDate,
          description: care.description,
          priority: care.priority
        })),
        overdue: overduePreventiveCare.map(care => ({
          id: care._id,
          type: 'preventive-care',
          title: care.title,
          date: care.scheduledDate,
          description: care.description,
          priority: care.priority,
          overdue: true
        }))
      }
    });
  } catch (error) {
    console.error('Reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

