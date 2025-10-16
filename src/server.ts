import 'dotenv/config';

import app from './app';
import { config } from './config/env';
import { connectDB } from './config/db';

(async () => {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`🚀 Server running on http://localhost:${config.port}`);
  });
})();