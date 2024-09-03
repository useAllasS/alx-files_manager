import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static async getStatus(req, res) {
    try {
      res
        .status(200)
        .json({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
    } catch (err) {
      res.status(400).send(`server error ${err}`);
    }
  }

  static async getStats(req, res) {
    try {
      res
        .status(200)
        .json({ users: await dbClient.nbUsers(), files: await dbClient.nbFiles() });
    } catch (err) {
      res.status(400).send('server error');
    }
  }
}

export default AppController;
