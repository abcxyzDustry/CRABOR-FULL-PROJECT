const redis = require('redis');
const { promisify } = require('util');

class RedisClient {
  constructor() {
    this.client = null;
    this.connected = false;
    this.connect();
  }

  connect() {
    const redisOptions = {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      retry_strategy: function(options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    };

    this.client = redis.createClient(redisOptions);

    // Promisify client methods
    this.client.getAsync = promisify(this.client.get).bind(this.client);
    this.client.setAsync = promisify(this.client.set).bind(this.client);
    this.client.delAsync = promisify(this.client.del).bind(this.client);
    this.client.keysAsync = promisify(this.client.keys).bind(this.client);
    this.client.expireAsync = promisify(this.client.expire).bind(this.client);
    this.client.ttlAsync = promisify(this.client.ttl).bind(this.client);
    this.client.incrAsync = promisify(this.client.incr).bind(this.client);
    this.client.decrAsync = promisify(this.client.decr).bind(this.client);
    this.client.hgetAsync = promisify(this.client.hget).bind(this.client);
    this.client.hsetAsync = promisify(this.client.hset).bind(this.client);
    this.client.hdelAsync = promisify(this.client.hdel).bind(this.client);
    this.client.hgetallAsync = promisify(this.client.hgetall).bind(this.client);

    // Event listeners
    this.client.on('connect', () => {
      this.connected = true;
      console.log('✅ Redis connected successfully');
    });

    this.client.on('error', (error) => {
      console.error('❌ Redis error:', error);
      this.connected = false;
    });

    this.client.on('end', () => {
      console.log('🔌 Redis disconnected');
      this.connected = false;
    });

    this.client.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });
  }

  // Basic operations
  async set(key, value, ttl = null) {
    try {
      if (ttl) {
        await this.client.setAsync(key, JSON.stringify(value), 'EX', ttl);
      } else {
        await this.client.setAsync(key, JSON.stringify(value));
      }
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async get(key) {
    try {
      const data = await this.client.getAsync(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async del(key) {
    try {
      await this.client.delAsync(key);
      return true;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  async exists(key) {
    try {
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  // TTL operations
  async expire(key, seconds) {
    try {
      await this.client.expireAsync(key, seconds);
      return true;
    } catch (error) {
      console.error('Redis expire error:', error);
      return false;
    }
  }

  async ttl(key) {
    try {
      return await this.client.ttlAsync(key);
    } catch (error) {
      console.error('Redis ttl error:', error);
      return -2; // Key doesn't exist
    }
  }

  // Increment/Decrement
  async incr(key) {
    try {
      return await this.client.incrAsync(key);
    } catch (error) {
      console.error('Redis incr error:', error);
      return null;
    }
  }

  async decr(key) {
    try {
      return await this.client.decrAsync(key);
    } catch (error) {
      console.error('Redis decr error:', error);
      return null;
    }
  }

  // Hash operations
  async hset(hash, field, value) {
    try {
      await this.client.hsetAsync(hash, field, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis hset error:', error);
      return false;
    }
  }

  async hget(hash, field) {
    try {
      const data = await this.client.hgetAsync(hash, field);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis hget error:', error);
      return null;
    }
  }

  async hgetall(hash) {
    try {
      const data = await this.client.hgetallAsync(hash);
      if (!data) return null;
      
      const result = {};
      for (const [key, value] of Object.entries(data)) {
        result[key] = JSON.parse(value);
      }
      return result;
    } catch (error) {
      console.error('Redis hgetall error:', error);
      return null;
    }
  }

  async hdel(hash, field) {
    try {
      await this.client.hdelAsync(hash, field);
      return true;
    } catch (error) {
      console.error('Redis hdel error:', error);
      return false;
    }
  }

  // List operations
  async lpush(key, value) {
    try {
      await this.client.lpush(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis lpush error:', error);
      return false;
    }
  }

  async rpush(key, value) {
    try {
      await this.client.rpush(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis rpush error:', error);
      return false;
    }
  }

  async lrange(key, start, stop) {
    try {
      const data = await this.client.lrange(key, start, stop);
      return data.map(item => JSON.parse(item));
    } catch (error) {
      console.error('Redis lrange error:', error);
      return [];
    }
  }

  // Set operations
  async sadd(key, value) {
    try {
      await this.client.sadd(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis sadd error:', error);
      return false;
    }
  }

  async smembers(key) {
    try {
      const data = await this.client.smembers(key);
      return data.map(item => JSON.parse(item));
    } catch (error) {
      console.error('Redis smembers error:', error);
      return [];
    }
  }

  // Cache-specific methods
  async cache(key, fetchFunction, ttl = 3600) {
    try {
      // Try to get from cache
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }
      
      // Fetch fresh data
      const freshData = await fetchFunction();
      
      // Store in cache
      if (freshData !== null && freshData !== undefined) {
        await this.set(key, freshData, ttl);
      }
      
      return freshData;
    } catch (error) {
      console.error('Cache error:', error);
      return await fetchFunction();
    }
  }

  // Rate limiting
  async rateLimit(key, limit, windowSeconds) {
    try {
      const current = await this.incr(key);
      
      if (current === 1) {
        await this.expire(key, windowSeconds);
      }
      
      return {
        current,
        limit,
        remaining: Math.max(0, limit - current),
        reset: await this.ttl(key)
      };
    } catch (error) {
      console.error('Rate limit error:', error);
      return null;
    }
  }

  // Session management
  async setSession(sessionId, sessionData, ttl = 24 * 3600) {
    return await this.set(`session:${sessionId}`, sessionData, ttl);
  }

  async getSession(sessionId) {
    return await this.get(`session:${sessionId}`);
  }

  async deleteSession(sessionId) {
    return await this.del(`session:${sessionId}`);
  }

  // Queue operations
  async enqueue(queueName, jobData) {
    return await this.lpush(`queue:${queueName}`, jobData);
  }

  async dequeue(queueName) {
    const data = await this.rpop(`queue:${queueName}`);
    return data ? JSON.parse(data) : null;
  }

  async queueLength(queueName) {
    return await this.client.llen(`queue:${queueName}`);
  }

  // Health check
  async healthCheck() {
    try {
      await this.client.ping();
      return {
        status: 'healthy',
        message: 'Redis connection is active',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Redis connection failed',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  // Close connection
  async close() {
    if (this.client) {
      await this.client.quit();
      console.log('👋 Redis connection closed');
    }
  }
}

// Create singleton instance
const redisClient = new RedisClient();

module.exports = redisClient;
