import { FileUpload, StorageService, createStorage } from '../../../services/storage.service';

import mongoose from 'mongoose';

const MemberSchema = new mongoose.Schema({
  gym_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String},
  nickname: { type: String },
  profilepic_content_type: { type: String },
  reference: { type: String },
  address: { type: String },
  current_status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  sessions: { type: Number, default: 0 },
  branch: { type: String },
  role: { type: String, enum: ['owner', 'collector', 'member'], default: 'member' },
  is_admin: {type: Boolean, default: false},
  can_access_bot: { type: Boolean, default: false },
  password: { type: String, select: false } // hashed password for owners/collectors
}, { timestamps: true });

// Unique per gym on phone
MemberSchema.index({ gym_id: 1, phone: 1, email: 1 }, { unique: true });

MemberSchema.methods.getProfilePicKey = function (): string {
  return `member-${this._id}/profilepic`;
};

MemberSchema.methods.uploadProfilePic = async function (file: FileUpload): Promise<string> {
  const storage: StorageService = createStorage();
  const filePath = this.getProfilePicKey();

  // Upload and get signed URL
  const { filePath: pathInStorage, url } = await storage.upload(file, filePath, {
    ResponseContentType: file.mimetype
  });
  this.profilepic_content_type = file.mimetype;
  await this.save();

  return url; // return signed URL to frontend
};

MemberSchema.methods.getProfilePicUrl = async function (): Promise<string> {
  if (!this.profile_pic) return '';

  const storage = createStorage();

  // Add extra params like ResponseContentType dynamically
  const extraParams = this.profilepic_content_type
    ? { ResponseContentType: this.profilepic_content_type }
    : {};

  return storage.getSignedUrl(this.profile_pic, undefined, extraParams);
};


export default mongoose.model('Member', MemberSchema);
