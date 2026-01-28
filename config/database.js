const mongoose = require('mongoose');

class Database {
  constructor() {
    this.connect();
  }

  connect() {
    // MongoDB connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 10000,
      retryWrites: true,
      w: 'majority'
    };

    // Get MongoDB URI from environment or use default
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://123456789a:123456789a@cluster0.tsgu8lv.mongodb.net/crabor?retryWrites=true&w=majority';

    mongoose.connect(MONGODB_URI, options)
      .then(() => {
        console.log('✅ MongoDB connected successfully');
        this.setupEventListeners();
      })
      .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        this.handleConnectionError(err);
      });
  }

  setupEventListeners() {
    mongoose.connection.on('connected', () => {
      console.log('📊 MongoDB connected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected');
      this.handleDisconnection();
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Close the Mongoose connection when the app terminates
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('👋 MongoDB connection closed through app termination');
      process.exit(0);
    });
  }

  async handleConnectionError(err) {
    console.error('MongoDB connection failed:', err.message);
    
    // Implement retry logic
    const maxRetries = 5;
    const retryDelay = 5000; // 5 seconds
    
    for (let i = 0; i < maxRetries; i++) {
      console.log(`Retrying connection (${i + 1}/${maxRetries})...`);
      
      try {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB reconnected successfully');
        return;
      } catch (retryErr) {
        console.error(`Retry ${i + 1} failed:`, retryErr.message);
      }
    }
    
    console.error('❌ All reconnection attempts failed');
    process.exit(1);
  }

  handleDisconnection() {
    // Implement disconnection handling logic
    console.log('Attempting to reconnect...');
    setTimeout(() => this.connect(), 5000);
  }

  // Health check
  async healthCheck() {
    try {
      await mongoose.connection.db.admin().ping();
      return {
        status: 'healthy',
        message: 'MongoDB connection is active',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'MongoDB connection failed',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  // Get database stats
  async getStats() {
    try {
      const stats = await mongoose.connection.db.stats();
      return {
        db: stats.db,
        collections: stats.collections,
        objects: stats.objects,
        avgObjSize: stats.avgObjSize,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize,
        fileSize: stats.fileSize
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return null;
    }
  }

  // Create indexes
  async createIndexes() {
    try {
      // Get all models
      const models = mongoose.modelNames();
      
      for (const modelName of models) {
        const model = mongoose.model(modelName);
        if (model.createIndexes) {
          await model.createIndexes();
          console.log(`✅ Created indexes for ${modelName}`);
        }
      }
      
      console.log('✅ All indexes created successfully');
    } catch (error) {
      console.error('❌ Failed to create indexes:', error);
    }
  }

  // Drop database (development only)
  async dropDatabase() {
    if (process.env.NODE_ENV !== 'production') {
      try {
        await mongoose.connection.db.dropDatabase();
        console.log('✅ Database dropped successfully');
      } catch (error) {
        console.error('❌ Failed to drop database:', error);
      }
    } else {
      console.error('❌ Cannot drop database in production');
    }
  }

  // Backup database
  async backupDatabase() {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    const backupDir = './backups';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `${backupDir}/backup-${timestamp}.gz`;
    
    try {
      // Create backup directory if it doesn't exist
      const fs = require('fs');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      // Create backup using mongodump
      const { MONGODB_URI } = process.env;
      const command = `mongodump --uri="${MONGODB_URI}" --archive="${backupFile}" --gzip`;
      
      await execPromise(command);
      console.log(`✅ Database backup created: ${backupFile}`);
      return backupFile;
    } catch (error) {
      console.error('❌ Database backup failed:', error);
      throw error;
    }
  }

  // Restore database
  async restoreDatabase(backupFile) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    try {
      // Restore using mongorestore
      const { MONGODB_URI } = process.env;
      const command = `mongorestore --uri="${MONGODB_URI}" --archive="${backupFile}" --gzip --drop`;
      
      await execPromise(command);
      console.log(`✅ Database restored from: ${backupFile}`);
    } catch (error) {
      console.error('❌ Database restore failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
const database = new Database();

module.exports = database;
