import { FileUpload, StorageService, createStorage } from '../../../services/storage.service';

import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const MemberSchema = new mongoose.Schema({
  gym: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true },
  name: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String},
  nickname: { type: String },
  profilepic_content_type: { type: String },
  referred_by: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Member',
  default: null,
},
  address: { type: String },
  working_status: { type: String},
  session: { type: String },
  branch: { type: String },
  role: { type: String, enum: ['owner', 'collector', 'member'], default: 'member' },
  is_admin: {type: Boolean, default: false},
  can_access_bot: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
  password: { type: String, select: false } // hashed password for owners/collectors
}, { timestamps: true });

// Unique per gym on phone
MemberSchema.index({ gym_id: 1, phone: 1, email: 1 });

MemberSchema.methods.isPasswordMatch = async function (password) {
    return await bcrypt.compare(password, this.password)
}

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

MemberSchema.methods.deleteProfilePic = async function (): Promise<void> {
  const storage: StorageService = createStorage();
  const filePath = this.getProfilePicKey();
  if (filePath) {
    await storage.delete(filePath);
    this.profilepic_content_type = null;
    await this.save();
}
};

MemberSchema.methods.getProfilePicUrl = async function (): Promise<string> {
  if (!this.profilepic_content_type) return '';

  const storage = createStorage();

  // Add extra params like ResponseContentType dynamically
  const extraParams = this.profilepic_content_type
    ? { ResponseContentType: this.profilepic_content_type }
    : {};
   
  return await storage.getSignedUrl(this.getProfilePicKey(), undefined, extraParams);
};

MemberSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(String(this.password), salt);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});


export default mongoose.model('Member', MemberSchema);
