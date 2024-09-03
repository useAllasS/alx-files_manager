import mongoDBCore from 'mongodb/lib/core';
import redisClient from './redis';
import dbClient from './db';

const xToken = async (req) => {
  const xToken = req.headers['x-token'];

  if (!xToken) {
    return null;
  }

  const id = await redisClient.get(`auth_${xToken}`);

  if (!id) {
    return null;
  }

  const user = await (dbClient.useCollection('users').findOne({ _id: new mongoDBCore.BSON.ObjectId(id) }));

  if (!user) {
    return null;
  }

  return user;
};

export default xToken;
