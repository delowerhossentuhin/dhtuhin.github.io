/**
 * scripts/seed-admin.ts
 *
 * Creates (or updates) the admin user using credentials from .env.
 * Run with:  npx tsx scripts/seed-admin.ts
 *
 * Required env: MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD
 * Optional env: ADMIN_NAME (defaults to "Admin")
 */
/* eslint-disable no-console */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

if (!MONGODB_URI) {
  console.error('✘  MONGODB_URI is not set in .env');
  process.exit(1);
}
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('✘  ADMIN_EMAIL and ADMIN_PASSWORD are required in .env');
  process.exit(1);
}

// Inline schema — keeps the script standalone (no path-alias resolution required).
const adminUserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: String,
    passwordHash: { type: String, required: true },
    role: { type: String, default: 'admin' },
  },
  { timestamps: true },
);

async function run() {
  console.log('• connecting to MongoDB…');
  await mongoose.connect(MONGODB_URI!, { serverSelectionTimeoutMS: 10_000 });

  const AdminUser =
    mongoose.models.AdminUser ?? mongoose.model('AdminUser', adminUserSchema);

  const email = ADMIN_EMAIL!.toLowerCase();
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD!, 12);

  const result = await AdminUser.findOneAndUpdate(
    { email },
    {
      email,
      name: ADMIN_NAME ?? 'Admin',
      passwordHash,
      role: 'admin',
    },
    { upsert: true, new: true },
  );

  console.log('✓  admin user ready:', result.email);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (err) => {
  console.error('✘  seed failed:', err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
