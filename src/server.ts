import app from './app';
import { config } from './config/env';
import { connectDB } from './config/db';
import dotenv from 'dotenv';

dotenv.config(); // must come first






(async () => {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`🚀 Server running on http://localhost:${config.port}`);
  });
})();