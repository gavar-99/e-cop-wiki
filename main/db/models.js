const { mongoose } = require('./mongoConnection');
const Schema = mongoose.Schema;

// User Schema
const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  salt: { type: String, required: true },
  hash: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'editor', 'reader'] },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Tag Schema
const tagSchema = new Schema({
  name: { type: String, required: true, unique: true, lowercase: true, trim: true },
  createdAt: { type: Date, default: Date.now }
});

// Asset Sub-Schema (embedded in Entry)
const assetSchema = new Schema({
  assetPath: { type: String, required: true },
  sha256Hash: { type: String, required: true },
  caption: { type: String, default: '' },
  displayOrder: { type: Number, default: 0 }
}, { _id: true });

// Infobox Field Sub-Schema (embedded in Entry)
const infoboxFieldSchema = new Schema({
  fieldKey: { type: String, required: true },
  fieldValue: { type: String, required: true },
  displayOrder: { type: Number, default: 0 }
}, { _id: false });

// Research Entry Schema
const entrySchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  sha256Hash: { type: String, unique: true, sparse: true },
  ipfsCid: { type: String },
  authorUsername: { type: String },
  tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
  assets: [assetSchema],
  infobox: [infoboxFieldSchema],
  deletedAt: { type: Date, default: null },
  deletedBy: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create text index for search
entrySchema.index({ title: 'text', content: 'text' });
entrySchema.index({ deletedAt: 1 });
entrySchema.index({ createdAt: -1 });

// Activity Log Schema
const activityLogSchema = new Schema({
  username: { type: String, required: true, index: true },
  action: { type: String, required: true, index: true },
  entityType: { type: String, required: true },
  entityId: { type: Schema.Types.ObjectId },
  entityTitle: { type: String },
  details: { type: String },
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now, index: true }
});

// Create models
const User = mongoose.model('User', userSchema);
const Tag = mongoose.model('Tag', tagSchema);
const Entry = mongoose.model('Entry', entrySchema);
const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = {
  User,
  Tag,
  Entry,
  ActivityLog
};
