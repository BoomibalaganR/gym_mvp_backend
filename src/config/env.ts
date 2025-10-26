import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/gym_mvp',
  jwtSecret: process.env.JWT_SECRET || 'change_this_secure_value',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  appEmail: process.env.APP_EMAIL || 'no-reply@example.com',

   project_id: 'vitagist-consumer-docu',//process.env.FIREBASE_PROJECT_ID,
    bucket_name: 'vitagist-consumer-docu.appspot.com',//process.env.FIREBASE_BUCKET_NAME,
    key_file: path.resolve(process.cwd(), 'serviceAccountKey.json'),
};
