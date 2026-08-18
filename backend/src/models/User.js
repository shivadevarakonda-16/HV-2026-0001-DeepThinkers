const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email address'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
  },
  passwordHash: {
    type: String,
    required: [true, 'Please provide a password hash'],
  },
  role: {
    type: String,
    enum: ['institution', 'student', 'verifier', 'admin'],
    default: 'student',
    required: true,
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    default: null,
  },
  institutionName: {
    type: String,
    default: null,
  },
  organizationName: {
    type: String,
    default: null, 
  },
  department: {
    type: String,
    default: null,
  },
  studentIdNumber: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);
