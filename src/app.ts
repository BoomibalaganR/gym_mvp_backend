import authRoutes from './api/v1/auth/auth.route';
import cors from 'cors';
import errorHandler from './middlewares/error.middleware';
import express from 'express';
import gymRoutes from './api/v1/gym/gym.route';
import memberRoutes from './api/v1/member/member.route';
import morgan from 'morgan';
import multer from 'multer';

// store file in memory as buffer (needed for Firebase/S3)
const storage = multer.memoryStorage();
const upload = multer({ storage });
const app = express();

app.use(cors());
app.use(upload.single('profile_pic')) 
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));

app.use('/api/v1/gym', gymRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/members', memberRoutes);

app.get('/api/v1/health', (_, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

export default app;
