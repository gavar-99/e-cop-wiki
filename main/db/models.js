const { mongoose } = require('./mongoConnection');
const Schema = mongoose.Schema;

// User Schema
const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  salt: { type: String, required: true },
  hash: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'editor', 'reader'] },
  active: { type: Boolean, default: true },
  profileImage: { type: String, default: null }, // Base64 encoded image stored in MongoDB
  createdAt: { type: Date, default: Date.now },
});

// Tag Schema
const tagSchema = new Schema({
  name: { type: String, required: true, unique: true, lowercase: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

// Asset Sub-Schema (embedded in Entry)
const assetSchema = new Schema(
  {
    assetPath: { type: String, required: true }, // Filename (hash.ext)
    sha256Hash: { type: String, required: true },
    gridfsId: { type: Schema.Types.ObjectId }, // Reference to MongoDB GridFS file
    ipfsCid: { type: String }, // IPFS Content Identifier
    mimeType: { type: String },
    size: { type: Number },
    caption: { type: String, default: '' },
    displayOrder: { type: Number, default: 0 },
  },
  { _id: true }
);

// Infobox Field Sub-Schema (embedded in Entry)
const infoboxFieldSchema = new Schema(
  {
    fieldKey: { type: String, required: true },
    fieldValue: { type: String, required: true },
    displayOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

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
  updatedAt: { type: Date, default: Date.now },
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
  timestamp: { type: Date, default: Date.now, index: true },
});

// User Preferences Schema
const userPreferencesSchema = new Schema({
  username: { type: String, required: true, unique: true },
  theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  accentColor: { type: String, default: '#36c' },
  fontFamily: { type: String, default: 'Linux Libertine' },
  fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
  lineHeight: { type: Number, default: 1.6 },
  sidebarPosition: { type: String, enum: ['left', 'right'], default: 'right' },
  defaultView: { type: String, enum: ['dashboard', 'lastViewed'], default: 'dashboard' },
  contentWidth: { type: String, enum: ['narrow', 'medium', 'wide'], default: 'medium' },
  spacing: { type: String, enum: ['compact', 'comfortable', 'spacious'], default: 'comfortable' },
  updatedAt: { type: Date, default: Date.now },
});

// Create models
const User = mongoose.model('User', userSchema);
const Tag = mongoose.model('Tag', tagSchema);
const Entry = mongoose.model('Entry', entrySchema);
const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
const UserPreferences = mongoose.model('UserPreferences', userPreferencesSchema);

module.exports = {
  User,
  Tag,
  Entry,
  ActivityLog,
  UserPreferences,
};
