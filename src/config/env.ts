import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
export const config = {
  port: Number(process.env.PORT),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/gym_mvp',
  jwtSecret: process.env.JWT_SECRET || 'change_this_secure_value',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  appEmail: process.env.APP_EMAIL || 'no-reply@example.com',
    node_env: process.env.NODE_ENV,
   project_id: process.env.FIREBASE_PROJECT_ID,
    bucket_name:process.env.FIREBASE_BUCKET_NAME,
    key_file: path.resolve(process.cwd(), 'serviceAccountKey.json'),
};
