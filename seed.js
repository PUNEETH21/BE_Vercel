const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');
const HealthRecord = require('./models/HealthRecord');
const PreventiveCare = require('./models/PreventiveCare');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare_wellness', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await Patient.deleteMany({});
    await Appointment.deleteMany({});
    await HealthRecord.deleteMany({});
    await PreventiveCare.deleteMany({});
    console.log('Database cleared');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
};

// Seed data
const seedDatabase = async () => {
  try {
    // Hash password for all users
    const hashedPassword = await bcrypt.hash('Password123!', 12);

    // Create Doctors
    const doctor1 = await User.create({
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@healthcare.com',
      password: hashedPassword,
      role: 'doctor',
      phone: '+1-555-0101',
      address: {
        street: '123 Medical Center Dr',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      }
    });

    const doctor2 = await User.create({
      name: 'Dr. Michael Chen',
      email: 'michael.chen@healthcare.com',
      password: hashedPassword,
      role: 'doctor',
      phone: '+1-555-0102',
      address: {
        street: '456 Health Plaza',
        city: 'New York',
        state: 'NY',
        zipCode: '10002',
        country: 'USA'
      }
    });

    // Create Patients
    const patient1 = await User.create({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: hashedPassword,
      role: 'patient',
      phone: '+1-555-0201',
      dateOfBirth: new Date('1985-05-15'),
      address: {
        street: '789 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10003',
        country: 'USA'
      }
    });

    const patient2 = await User.create({
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      password: hashedPassword,
      role: 'patient',
      phone: '+1-555-0202',
      dateOfBirth: new Date('1990-08-22'),
      address: {
        street: '321 Oak Avenue',
        city: 'New York',
        state: 'NY',
        zipCode: '10004',
        country: 'USA'
      }
    });

    const patient3 = await User.create({
      name: 'Robert Wilson',
      email: 'robert.wilson@example.com',
      password: hashedPassword,
      role: 'patient',
      phone: '+1-555-0203',
      dateOfBirth: new Date('1978-12-10'),
      address: {
        street: '654 Pine Road',
        city: 'New York',
        state: 'NY',
        zipCode: '10005',
        country: 'USA'
      }
    });

    console.log('Users created');

    // Create Patient Profiles
    const patientProfile1 = await Patient.create({
      userId: patient1._id,
      bloodGroup: 'O+',
      height: { value: 175, unit: 'cm' },
      weight: { value: 75, unit: 'kg' },
      medicalHistory: [
        {
          condition: 'Hypertension',
          diagnosisDate: new Date('2020-03-15'),
          status: 'active',
          notes: 'Controlled with medication'
        },
        {
          condition: 'Type 2 Diabetes',
          diagnosisDate: new Date('2019-06-20'),
          status: 'active',
          notes: 'Well managed'
        }
      ],
      allergies: [
        {
          allergen: 'Penicillin',
          severity: 'severe',
          notes: 'Causes severe rash'
        },
        {
          allergen: 'Peanuts',
          severity: 'moderate',
          notes: 'Avoid all peanut products'
        }
      ],
      medications: [
        {
          name: 'Metformin',
          dosage: '500mg',
          frequency: 'Twice daily',
          startDate: new Date('2019-06-20'),
          prescribedBy: doctor1._id
        },
        {
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once daily',
          startDate: new Date('2020-03-15'),
          prescribedBy: doctor1._id
        }
      ],
      emergencyContact: {
        name: 'Mary Doe',
        relationship: 'Spouse',
        phone: '+1-555-0204',
        email: 'mary.doe@example.com'
      },
      insurance: {
        provider: 'Blue Cross Blue Shield',
        policyNumber: 'BC123456789',
        groupNumber: 'GRP001'
      }
    });

    const patientProfile2 = await Patient.create({
      userId: patient2._id,
      bloodGroup: 'A+',
      height: { value: 165, unit: 'cm' },
      weight: { value: 60, unit: 'kg' },
      medicalHistory: [
        {
          condition: 'Asthma',
          diagnosisDate: new Date('2015-02-10'),
          status: 'active',
          notes: 'Mild, well controlled'
        }
      ],
      allergies: [
        {
          allergen: 'Dust',
          severity: 'mild',
          notes: 'Causes sneezing'
        }
      ],
      medications: [
        {
          name: 'Albuterol Inhaler',
          dosage: '90mcg',
          frequency: 'As needed',
          startDate: new Date('2015-02-10'),
          prescribedBy: doctor2._id
        }
      ],
      emergencyContact: {
        name: 'Tom Smith',
        relationship: 'Brother',
        phone: '+1-555-0205',
        email: 'tom.smith@example.com'
      }
    });

    const patientProfile3 = await Patient.create({
      userId: patient3._id,
      bloodGroup: 'B+',
      height: { value: 180, unit: 'cm' },
      weight: { value: 85, unit: 'kg' },
      medicalHistory: [
        {
          condition: 'High Cholesterol',
          diagnosisDate: new Date('2021-01-05'),
          status: 'active',
          notes: 'Diet and exercise recommended'
        }
      ],
      medications: [
        {
          name: 'Atorvastatin',
          dosage: '20mg',
          frequency: 'Once daily',
          startDate: new Date('2021-01-05'),
          prescribedBy: doctor1._id
        }
      ]
    });

    console.log('Patient profiles created');

    // Create Appointments
    const today = new Date();
    const appointments = [
      {
        patient: patient1._id,
        doctor: doctor1._id,
        appointmentDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        appointmentTime: '10:00',
        duration: 30,
        type: 'consultation',
        status: 'confirmed',
        reason: 'Regular checkup and medication review'
      },
      {
        patient: patient1._id,
        doctor: doctor1._id,
        appointmentDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        appointmentTime: '14:30',
        duration: 30,
        type: 'follow-up',
        status: 'completed',
        reason: 'Follow-up on blood pressure medication',
        notes: 'Patient responding well to medication',
        diagnosis: 'Hypertension - stable'
      },
      {
        patient: patient2._id,
        doctor: doctor2._id,
        appointmentDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        appointmentTime: '11:00',
        duration: 30,
        type: 'checkup',
        status: 'scheduled',
        reason: 'Annual physical examination'
      },
      {
        patient: patient2._id,
        doctor: doctor2._id,
        appointmentDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        appointmentTime: '09:00',
        duration: 30,
        type: 'consultation',
        status: 'completed',
        reason: 'Asthma management review',
        notes: 'Asthma well controlled, continue current treatment'
      },
      {
        patient: patient3._id,
        doctor: doctor1._id,
        appointmentDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        appointmentTime: '15:00',
        duration: 30,
        type: 'preventive',
        status: 'scheduled',
        reason: 'Cholesterol screening and wellness check'
      },
      {
        patient: patient1._id,
        doctor: doctor2._id,
        appointmentDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        appointmentTime: '10:30',
        duration: 30,
        type: 'follow-up',
        status: 'scheduled',
        reason: 'Diabetes management follow-up'
      }
    ];

    await Appointment.insertMany(appointments);
    console.log('Appointments created');

    // Create Health Records
    const healthRecords = [
      {
        patient: patient1._id,
        recordType: 'vital-signs',
        title: 'Blood Pressure Reading',
        date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
        vitalSigns: {
          bloodPressure: { systolic: 120, diastolic: 80 },
          heartRate: 72,
          temperature: { value: 36.5, unit: 'celsius' },
          respiratoryRate: 16,
          oxygenSaturation: 98,
          weight: 75,
          height: 175
        },
        notes: 'All vital signs within normal range',
        recordedBy: doctor1._id
      },
      {
        patient: patient1._id,
        recordType: 'lab-result',
        title: 'Blood Glucose Test',
        date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
        labResults: {
          testName: 'Fasting Blood Glucose',
          results: { value: 95, unit: 'mg/dL' },
          normalRange: '70-100 mg/dL',
          status: 'normal'
        },
        notes: 'Blood glucose levels well controlled',
        recordedBy: doctor1._id
      },
      {
        patient: patient1._id,
        recordType: 'lab-result',
        title: 'HbA1c Test',
        date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
        labResults: {
          testName: 'Hemoglobin A1c',
          results: { value: 6.2, unit: '%' },
          normalRange: '< 7.0%',
          status: 'normal'
        },
        notes: 'Excellent diabetes control',
        recordedBy: doctor1._id
      },
      {
        patient: patient2._id,
        recordType: 'vital-signs',
        title: 'Routine Vital Signs',
        date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
        vitalSigns: {
          bloodPressure: { systolic: 110, diastolic: 70 },
          heartRate: 68,
          temperature: { value: 36.7, unit: 'celsius' },
          respiratoryRate: 14,
          oxygenSaturation: 99,
          weight: 60,
          height: 165
        },
        notes: 'All normal',
        recordedBy: doctor2._id
      },
      {
        patient: patient2._id,
        recordType: 'screening',
        title: 'Chest X-Ray',
        date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
        notes: 'Chest X-ray clear, no abnormalities detected',
        recordedBy: doctor2._id
      },
      {
        patient: patient3._id,
        recordType: 'lab-result',
        title: 'Lipid Panel',
        date: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000),
        labResults: {
          testName: 'Complete Lipid Panel',
          results: {
            totalCholesterol: 220,
            ldl: 140,
            hdl: 45,
            triglycerides: 150
          },
          normalRange: 'Total: < 200, LDL: < 100, HDL: > 40',
          status: 'abnormal'
        },
        notes: 'Elevated cholesterol, started on statin therapy',
        recordedBy: doctor1._id
      },
      {
        patient: patient1._id,
        recordType: 'vaccination',
        title: 'COVID-19 Booster',
        date: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        notes: 'COVID-19 booster vaccination administered',
        recordedBy: doctor1._id
      },
      {
        patient: patient2._id,
        recordType: 'vaccination',
        title: 'Annual Flu Shot',
        date: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000),
        notes: 'Seasonal influenza vaccination',
        recordedBy: doctor2._id
      }
    ];

    await HealthRecord.insertMany(healthRecords);
    console.log('Health records created');

    // Create Preventive Care
    const preventiveCare = [
      {
        patient: patient1._id,
        careType: 'screening',
        title: 'Annual Blood Test',
        description: 'Complete blood count, lipid panel, and metabolic panel',
        scheduledDate: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        status: 'scheduled',
        priority: 'medium',
        frequency: 'yearly',
        assignedBy: doctor1._id
      },
      {
        patient: patient1._id,
        careType: 'screening',
        title: 'Eye Examination',
        description: 'Annual diabetic eye exam',
        scheduledDate: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        status: 'scheduled',
        priority: 'high',
        frequency: 'yearly',
        assignedBy: doctor1._id
      },
      {
        patient: patient1._id,
        careType: 'screening',
        title: 'Annual Blood Test',
        description: 'Complete blood count and metabolic panel',
        scheduledDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        completedDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        status: 'completed',
        priority: 'medium',
        frequency: 'yearly',
        assignedBy: doctor1._id,
        notes: 'All results within normal range'
      },
      {
        patient: patient2._id,
        careType: 'screening',
        title: 'Mammogram',
        description: 'Annual breast cancer screening',
        scheduledDate: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        status: 'scheduled',
        priority: 'high',
        frequency: 'yearly',
        assignedBy: doctor2._id
      },
      {
        patient: patient2._id,
        careType: 'vaccination',
        title: 'Tetanus Booster',
        description: 'Tetanus, diphtheria, and pertussis (Tdap) booster',
        scheduledDate: new Date(today.getTime() + 120 * 24 * 60 * 60 * 1000), // 120 days from now
        status: 'scheduled',
        priority: 'low',
        frequency: 'one-time',
        assignedBy: doctor2._id
      },
      {
        patient: patient3._id,
        careType: 'screening',
        title: 'Colonoscopy',
        description: 'Colorectal cancer screening',
        scheduledDate: new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000), // 180 days from now
        status: 'scheduled',
        priority: 'high',
        frequency: 'yearly',
        assignedBy: doctor1._id
      },
      {
        patient: patient3._id,
        careType: 'health-check',
        title: 'Cardiac Stress Test',
        description: 'Exercise stress test for cardiovascular health',
        scheduledDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'scheduled',
        priority: 'medium',
        frequency: 'one-time',
        assignedBy: doctor1._id
      },
      {
        patient: patient1._id,
        careType: 'wellness-program',
        title: 'Diabetes Education Program',
        description: 'Nutrition and lifestyle management for diabetes',
        scheduledDate: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        completedDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
        status: 'completed',
        priority: 'high',
        frequency: 'one-time',
        assignedBy: doctor1._id,
        notes: 'Patient completed program successfully'
      }
    ];

    await PreventiveCare.insertMany(preventiveCare);
    console.log('Preventive care records created');

    console.log('\n✅ Database seeded successfully!');
    console.log('\nSample Users:');
    console.log('  - Patient: john.doe@example.com / Password123!');
    console.log('  - Patient: jane.smith@example.com / Password123!');
    console.log('  - Patient: robert.wilson@example.com / Password123!');
    console.log('  - Doctor: sarah.johnson@healthcare.com / Password123!');
    console.log('  - Doctor: michael.chen@healthcare.com / Password123!');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

// Main execution
const runSeed = async () => {
  try {
    await connectDB();
    await clearDatabase();
    await seedDatabase();
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Seed script error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  runSeed();
}

module.exports = { runSeed };

