import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.redisAlive = true;
    this.client.on('error', (err) => {
      console.log(`Redis client not connected to the server:  ${err}`);
      this.redisAlive = false;
    });
    this.client.on('connect', () => {
      this.redisAlive = true;
    });
  }

  isAlive() {
    return this.redisAlive;
  }

  async get(key) {
    return promisify(this.client.get).bind(this.client)(key);
  }

  async set(key, value, dur) {
    promisify(this.client.setex).bind(this.client)(key, dur, value);
  }

  async del(key) {
    await this.client.del(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
