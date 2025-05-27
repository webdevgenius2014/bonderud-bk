import mongoose from 'mongoose';
import env from './env.js';
import logger from './logger.js';

class Database {
  constructor(options = {}) {
    this.retryCount = 0;
    this.maxRetries = options.maxRetries ?? 5;
    this.retryDelay = options.retryDelay ?? 5000;
  }

  async connect() {
    try {
      const mongoUri = env.NODE_ENV === 'test' 
        ? env.MONGODB_TEST_URI || env.MONGODB_URI 
        : env.MONGODB_URI;

      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      logger.info(`MongoDB connected successfully to ${env.NODE_ENV} database`);
      this.retryCount = 0;

      this.setupEventListeners();
    } catch (error) {
      logger.error('MongoDB connection failed:', error);
      await this.handleConnectionError();
    }
  }

  async handleConnectionError() {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      logger.warn(`Retrying MongoDB connection... Attempt ${this.retryCount}/${this.maxRetries}`);
      
      await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      await this.connect();
    } else {
      logger.error('Max retry attempts reached. MongoDB connection failed permanently.');
      process.exit(1);
    }
  }

  setupEventListeners() {
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  async disconnect() {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    } catch (error) {
      logger.error('Error closing MongoDB connection:', error);
    }
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }

  getConnectionState() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    return states[mongoose.connection.readyState] || 'unknown';
  }
}

export const database = new Database();
export default database;