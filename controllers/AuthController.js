import { v4 } from 'uuid';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const { user } = req;
    const token = v4();

    await redisClient.set(`auth_${token}`, user._id.toString(), 86400);
    res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const xToken = req.headers['x-token'];

    await redisClient.del(`auth_${xToken}`);
    res.status(204).send();
  }
}

export default AuthController;
