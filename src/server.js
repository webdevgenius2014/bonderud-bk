import express from 'express';
import { setupMiddleware, setupErrorHandling } from './middleware/index.js';
import database from './config/database.js';
import logger from './config/logger.js';
import env from './config/env.js';
import routes from './routes/index.js';

const app = express();

setupMiddleware(app);

app.use(routes);

setupErrorHandling(app);

const startServer = async () => {
  try {
    await database.connect();
    
    const server = app.listen(env.PORT, env.HOST, () => {
      logger.info(`🚀 Server running on http://${env.HOST}:${env.PORT}`);
      logger.info(`📚 Environment: ${env.NODE_ENV}`);
      logger.info(`🗄️  Database: ${database.isConnected() ? 'Connected' : 'Disconnected'}`);
    });

    const gracefulShutdown = (signal) => {
      logger.info(`Received ${signal}. Gracefully shutting down...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await database.disconnect();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export default app;