const request = require('supertest');
const express = require('express');
const appointmentRoutes = require('../../routes/appointments');
const User = require('../../models/User');
const Appointment = require('../../models/Appointment');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use('/api/appointments', appointmentRoutes);

// Helper function to generate token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET);
};

describe('Appointments Routes', () => {
  let patientToken, doctorToken, adminToken;
  let patientId, doctorId, adminId;

  beforeEach(async () => {
    // Create test users
    const patient = await User.create({
      name: 'Patient User',
      email: 'patient@example.com',
      password: 'Test123456',
      role: 'patient'
    });
    patientId = patient._id;
    patientToken = generateToken(patientId);

    const doctor = await User.create({
      name: 'Doctor User',
      email: 'doctor@example.com',
      password: 'Test123456',
      role: 'doctor'
    });
    doctorId = doctor._id;
    doctorToken = generateToken(doctorId);

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Test123456',
      role: 'admin'
    });
    adminId = admin._id;
    adminToken = generateToken(adminId);
  });

  describe('GET /api/appointments', () => {
    it('should get all appointments for patient', async () => {
      // Create test appointment
      await Appointment.create({
        patient: patientId,
        doctor: doctorId,
        appointmentDate: new Date('2024-12-31'),
        appointmentTime: '10:00',
        reason: 'Regular checkup',
        type: 'consultation'
      });

      const response = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data).toHaveLength(1);
    });

    it('should filter appointments by status', async () => {
      await Appointment.create([
        {
          patient: patientId,
          doctor: doctorId,
          appointmentDate: new Date('2024-12-31'),
          appointmentTime: '10:00',
          reason: 'Checkup 1',
          status: 'scheduled'
        },
        {
          patient: patientId,
          doctor: doctorId,
          appointmentDate: new Date('2024-12-31'),
          appointmentTime: '11:00',
          reason: 'Checkup 2',
          status: 'completed'
        }
      ]);

      const response = await request(app)
        .get('/api/appointments?status=scheduled')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.count).toBe(1);
      expect(response.body.data[0].status).toBe('scheduled');
    });

    it('should only show patient their own appointments', async () => {
      const otherPatient = await User.create({
        name: 'Other Patient',
        email: 'other@example.com',
        password: 'Test123456',
        role: 'patient'
      });

      await Appointment.create([
        {
          patient: patientId,
          doctor: doctorId,
          appointmentDate: new Date('2024-12-31'),
          appointmentTime: '10:00',
          reason: 'My appointment'
        },
        {
          patient: otherPatient._id,
          doctor: doctorId,
          appointmentDate: new Date('2024-12-31'),
          appointmentTime: '11:00',
          reason: 'Other appointment'
        }
      ]);

      const response = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.count).toBe(1);
      expect(response.body.data[0].reason).toBe('My appointment');
    });
  });

  describe('GET /api/appointments/:id', () => {
    let appointmentId;

    beforeEach(async () => {
      const appointment = await Appointment.create({
        patient: patientId,
        doctor: doctorId,
        appointmentDate: new Date('2024-12-31'),
        appointmentTime: '10:00',
        reason: 'Regular checkup'
      });
      appointmentId = appointment._id;
    });

    it('should get single appointment for authorized patient', async () => {
      const response = await request(app)
        .get(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id.toString()).toBe(appointmentId.toString());
    });

    it('should reject access for unauthorized patient', async () => {
      const otherPatient = await User.create({
        name: 'Other Patient',
        email: 'other@example.com',
        password: 'Test123456',
        role: 'patient'
      });
      const otherToken = generateToken(otherPatient._id);

      const response = await request(app)
        .get(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent appointment', async () => {
      const mongoose = require('mongoose');
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/appointments/${fakeId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/appointments', () => {
    it('should create new appointment', async () => {
      const appointmentData = {
        doctor: doctorId.toString(),
        appointmentDate: '2024-12-31',
        appointmentTime: '10:00',
        reason: 'Regular checkup',
        type: 'consultation'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(appointmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reason).toBe(appointmentData.reason);
      expect(response.body.data.patient._id.toString()).toBe(patientId.toString());
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctor: doctorId.toString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate appointment type enum', async () => {
      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctor: doctorId.toString(),
          appointmentDate: '2024-12-31',
          appointmentTime: '10:00',
          reason: 'Checkup',
          type: 'invalid-type'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/appointments/:id', () => {
    let appointmentId;

    beforeEach(async () => {
      const appointment = await Appointment.create({
        patient: patientId,
        doctor: doctorId,
        appointmentDate: new Date('2024-12-31'),
        appointmentTime: '10:00',
        reason: 'Regular checkup'
      });
      appointmentId = appointment._id;
    });

    it('should update appointment status', async () => {
      const response = await request(app)
        .put(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          status: 'confirmed'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('confirmed');
    });

    it('should reject update for unauthorized patient', async () => {
      const otherPatient = await User.create({
        name: 'Other Patient',
        email: 'other@example.com',
        password: 'Test123456',
        role: 'patient'
      });
      const otherToken = generateToken(otherPatient._id);

      const response = await request(app)
        .put(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          status: 'confirmed'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should validate status enum', async () => {
      const response = await request(app)
        .put(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          status: 'invalid-status'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/appointments/:id', () => {
    let appointmentId;

    beforeEach(async () => {
      const appointment = await Appointment.create({
        patient: patientId,
        doctor: doctorId,
        appointmentDate: new Date('2024-12-31'),
        appointmentTime: '10:00',
        reason: 'Regular checkup'
      });
      appointmentId = appointment._id;
    });

    it('should cancel appointment', async () => {
      const response = await request(app)
        .delete(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('cancelled');

      // Verify appointment status is updated
      const appointment = await Appointment.findById(appointmentId);
      expect(appointment.status).toBe('cancelled');
    });

    it('should reject cancellation for unauthorized patient', async () => {
      const otherPatient = await User.create({
        name: 'Other Patient',
        email: 'other@example.com',
        password: 'Test123456',
        role: 'patient'
      });
      const otherToken = generateToken(otherPatient._id);

      const response = await request(app)
        .delete(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
