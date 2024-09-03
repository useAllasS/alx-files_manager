import sha1 from 'sha1';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }
    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }

    const user = await dbClient.useCollection('users').findOne({ email });

    if (user) {
      res.status(400).json({ error: 'Already exist' });
      return;
    }

    const insertion = await dbClient.useCollection('users').insertOne({ email, password: sha1(password) });
    const id = insertion.insertedId;

    res.status(201).json({ email, id });
  }

  static async getMe(req, res) {
    const { _id, email } = req.user;

    res.status(200).json({ id: _id, email });
  }
}

export default UsersController;
