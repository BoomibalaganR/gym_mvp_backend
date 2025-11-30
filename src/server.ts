import dotenv from 'dotenv';
import app from './app';
import { connectDB } from './config/db';
import { config } from './config/env';

dotenv.config(); // must come first






(async () => {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`🚀 Server running on http://localhost:${config.port}`);
  });
})();