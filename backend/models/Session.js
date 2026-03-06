import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  attentionScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  interventionType: {
    type: String,
    required: true,
    enum: ['none', 'visual', 'auditory', 'haptic', 'multi-modal']
  },
  taskContext: {
    type: String,
    required: true
  },
  environmentalFactors: {
    noiseLevel: {
      type: String,
      enum: ['quiet', 'moderate', 'loud'],
      default: 'moderate'
    },
    lighting: {
      type: String,
      enum: ['dim', 'normal', 'bright'],
      default: 'normal'
    },
    temperature: {
      type: String,
      enum: ['cold', 'comfortable', 'warm'],
      default: 'comfortable'
    }
  },
  sessionDuration: {
    type: Number,
    required: true,
    min: 0
  },
  baselineScore: {
    type: Number,
    min: 0,
    max: 100
  },
  peakScore: {
    type: Number,
    min: 0,
    max: 100
  },
  averageScore: {
    type: Number,
    min: 0,
    max: 100
  },
  stressLevel: {
    type: String,
    enum: ['low', 'moderate', 'high'],
    default: 'moderate'
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  eegData: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
sessionSchema.index({ userId: 1, timestamp: -1 });
sessionSchema.index({ interventionType: 1 });
sessionSchema.index({ taskContext: 1 });

const Session = mongoose.model('Session', sessionSchema);

export default Session;
