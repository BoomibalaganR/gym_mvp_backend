import dotenv from 'dotenv';

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
    
    aws_region: process.env.AWS_REGION,
    aws_access_key: process.env.AWS_ACCESS_KEY_ID,
    aws_secret_key: process.env.AWS_SECRET_ACCESS_KEY,
    bucket_name: process.env.AWS_BUCKET_NAME,
};
