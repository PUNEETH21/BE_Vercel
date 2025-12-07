const Appointment = require('../../models/Appointment');
const User = require('../../models/User');

describe('Appointment Model', () => {
  let patientId, doctorId;

  beforeEach(async () => {
    const patient = await User.create({
      name: 'Patient User',
      email: 'patient@example.com',
      password: 'Test123456',
      role: 'patient'
    });
    patientId = patient._id;

    const doctor = await User.create({
      name: 'Doctor User',
      email: 'doctor@example.com',
      password: 'Test123456',
      role: 'doctor'
    });
    doctorId = doctor._id;
  });

  describe('Appointment Creation', () => {
    it('should create an appointment with valid data', async () => {
      const appointmentData = {
        patient: patientId,
        doctor: doctorId,
        appointmentDate: new Date('2024-12-31'),
        appointmentTime: '10:00',
        reason: 'Regular checkup',
        type: 'consultation'
      };

      const appointment = await Appointment.create(appointmentData);

      expect(appointment._id).toBeDefined();
      expect(appointment.patient.toString()).toBe(patientId.toString());
      expect(appointment.doctor.toString()).toBe(doctorId.toString());
      expect(appointment.reason).toBe(appointmentData.reason);
      expect(appointment.type).toBe(appointmentData.type);
      expect(appointment.status).toBe('scheduled');
      expect(appointment.duration).toBe(30); // default value
    });

    it('should require patient field', async () => {
      const appointmentData = {
        doctor: doctorId,
        appointmentDate: new Date('2024-12-31'),
        appointmentTime: '10:00',
        reason: 'Regular checkup'
      };

      await expect(Appointment.create(appointmentData)).rejects.toThrow();
    });

    it('should require doctor field', async () => {
      const appointmentData = {
        patient: patientId,
        appointmentDate: new Date('2024-12-31'),
        appointmentTime: '10:00',
        reason: 'Regular checkup'
      };

      await expect(Appointment.create(appointmentData)).rejects.toThrow();
    });

    it('should require appointmentDate field', async () => {
      const appointmentData = {
        patient: patientId,
        doctor: doctorId,
        appointmentTime: '10:00',
        reason: 'Regular checkup'
      };

      await expect(Appointment.create(appointmentData)).rejects.toThrow();
    });

    it('should require appointmentTime field', async () => {
      const appointmentData = {
        patient: patientId,
        doctor: doctorId,
        appointmentDate: new Date('2024-12-31'),
        reason: 'Regular checkup'
      };

      await expect(Appointment.create(appointmentData)).rejects.toThrow();
    });

    it('should require reason field', async () => {
      const appointmentData = {
        patient: patientId,
        doctor: doctorId,
        appointmentDate: new Date('2024-12-31'),
        appointmentTime: '10:00'
      };

      await expect(Appointment.create(appointmentData)).rejects.toThrow();
    });

    it('should validate type enum', async () => {
      const appointmentData = {
        patient: patientId,
        doctor: doctorId,
        appointmentDate: new Date('2024-12-31'),
        appointmentTime: '10:00',
        reason: 'Regular checkup',
        type: 'invalid-type'
      };

      await expect(Appointment.create(appointmentData)).rejects.toThrow();
    });

    it('should validate status enum', async () => {
      const appointmentData = {
        patient: patientId,
        doctor: doctorId,
        appointmentDate: new Date('2024-12-31'),
        appointmentTime: '10:00',
        reason: 'Regular checkup',
        status: 'invalid-status'
      };

      await expect(Appointment.create(appointmentData)).rejects.toThrow();
    });

    it('should default status to scheduled', async () => {
      const appointmentData = {
        patient: patientId,
        doctor: doctorId,
        appointmentDate: new Date('2024-12-31'),
        appointmentTime: '10:00',
        reason: 'Regular checkup'
      };

      const appointment = await Appointment.create(appointmentData);
      expect(appointment.status).toBe('scheduled');
    });

    it('should default duration to 30 minutes', async () => {
      const appointmentData = {
        patient: patientId,
        doctor: doctorId,
        appointmentDate: new Date('2024-12-31'),
        appointmentTime: '10:00',
        reason: 'Regular checkup'
      };

      const appointment = await Appointment.create(appointmentData);
      expect(appointment.duration).toBe(30);
    });

    it('should accept custom duration', async () => {
      const appointmentData = {
        patient: patientId,
        doctor: doctorId,
        appointmentDate: new Date('2024-12-31'),
        appointmentTime: '10:00',
        reason: 'Regular checkup',
        duration: 60
      };

      const appointment = await Appointment.create(appointmentData);
      expect(appointment.duration).toBe(60);
    });

    it('should accept all valid appointment types', async () => {
      const types = ['consultation', 'follow-up', 'checkup', 'emergency', 'preventive'];

      for (const type of types) {
        const appointmentData = {
          patient: patientId,
          doctor: doctorId,
          appointmentDate: new Date('2024-12-31'),
          appointmentTime: '10:00',
          reason: 'Regular checkup',
          type
        };

        const appointment = await Appointment.create(appointmentData);
        expect(appointment.type).toBe(type);
      }
    });

    it('should accept all valid statuses', async () => {
      const statuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'];

      for (const status of statuses) {
        const appointmentData = {
          patient: patientId,
          doctor: doctorId,
          appointmentDate: new Date('2024-12-31'),
          appointmentTime: '10:00',
          reason: 'Regular checkup',
          status
        };

        const appointment = await Appointment.create(appointmentData);
        expect(appointment.status).toBe(status);
      }
    });

    it('should store prescription data', async () => {
      const appointmentData = {
        patient: patientId,
        doctor: doctorId,
        appointmentDate: new Date('2024-12-31'),
        appointmentTime: '10:00',
        reason: 'Regular checkup',
        prescription: [
          {
            medication: 'Aspirin',
            dosage: '100mg',
            frequency: 'Once daily',
            duration: '7 days'
          }
        ]
      };

      const appointment = await Appointment.create(appointmentData);
      expect(appointment.prescription).toHaveLength(1);
      expect(appointment.prescription[0].medication).toBe('Aspirin');
    });
  });

  describe('Timestamps', () => {
    it('should set createdAt and updatedAt', async () => {
      const appointmentData = {
        patient: patientId,
        doctor: doctorId,
        appointmentDate: new Date('2024-12-31'),
        appointmentTime: '10:00',
        reason: 'Regular checkup'
      };

      const appointment = await Appointment.create(appointmentData);
      expect(appointment.createdAt).toBeDefined();
      expect(appointment.updatedAt).toBeDefined();
    });

    it('should update updatedAt on save', async () => {
      const appointmentData = {
        patient: patientId,
        doctor: doctorId,
        appointmentDate: new Date('2024-12-31'),
        appointmentTime: '10:00',
        reason: 'Regular checkup'
      };

      const appointment = await Appointment.create(appointmentData);
      const originalUpdatedAt = appointment.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 100));

      appointment.status = 'confirmed';
      await appointment.save();

      expect(appointment.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});
