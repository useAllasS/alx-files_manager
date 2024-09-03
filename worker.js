import Queue from 'bull';
import dbClient from './utils/db';

const fileQueue = new Queue('fileQueue');
const userQueue = new Queue('userQueue');

fileQueue.process(async (job, done) => {
    const { fileId = null, userId = null } = job.data;

    if (!fileId) {
	throw new Error('Missing fileId');
    }
    if (!userId) {
	throw new Error('Missing userId');
    }
})
