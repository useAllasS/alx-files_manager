import mongodb from 'mongodb';

class DBClient {
  constructor() {
    this.db = { connected: false };
    this.host = process.env.DB_HOST || '127.0.0.1';
    this.port = process.env.DB_PORT || 27017;
    this.dbase = process.env.DB_DATABASE || 'files_manager';
    this.client = new mongodb.MongoClient(`mongodb://${this.host}:${this.port}/${this.dbase}`,
      { useUnifiedTopology: true });
    this.client.on('open', () => { this.db.connected = true; });
    this.client.connect();
  }

  isAlive() {
    return this.db.connected;
  }

  nbUsers() {
    return this.client.db().collection('users').countDocuments();
  }

  nbFiles() {
    return this.client.db().collection('files').countDocuments();
  }

  useCollection(coll) {
    return this.client.db().collection(coll);
  }
}

const dbClient = new DBClient();
export default dbClient;
