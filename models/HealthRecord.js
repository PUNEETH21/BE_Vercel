const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recordType: {
    type: String,
    enum: ['vital-signs', 'lab-result', 'imaging', 'vaccination', 'screening', 'other'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  vitalSigns: {
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    heartRate: Number,
    temperature: {
      value: Number,
      unit: {
        type: String,
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius'
      }
    },
    respiratoryRate: Number,
    oxygenSaturation: Number,
    weight: Number,
    height: Number
  },
  labResults: {
    testName: String,
    results: mongoose.Schema.Types.Mixed,
    normalRange: String,
    status: {
      type: String,
      enum: ['normal', 'abnormal', 'critical'],
      default: 'normal'
    }
  },
  notes: String,
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
healthRecordSchema.index({ patient: 1, date: -1 });
healthRecordSchema.index({ recordType: 1 });

module.exports = mongoose.model('HealthRecord', healthRecordSchema);

