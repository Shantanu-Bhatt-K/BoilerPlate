import mongoose, { Document } from 'mongoose';
import { hashPassword, comparePassword } from '../utils/hashing.js';
export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: 'admin' | 'user';
  deletedAt: Date | null;
  comparePassword(plainPassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) {
    return;
  }
  this.passwordHash = await hashPassword(this.passwordHash);
});

userSchema.methods.comparePassword = async function (
  plainPassword: string
): Promise<boolean> {
  return comparePassword(plainPassword, this.passwordHash);
};
const User = mongoose.model('User', userSchema);

export default User;
