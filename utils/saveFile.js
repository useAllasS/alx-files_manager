const { access, mkdir, open, write } = require('fs');
const { v4: uuidv4 } = require('uuid');

const saveFile = (data) => {
  const dirName = process.env.FOLDER_PATH || '/tmp/files_manager';

  return new Promise((resolve, reject) => {
    access(dirName, (err) => {
      let fileId;

      if (err) {
        if (err.code === 'ENOENT') {
          mkdir(dirName, { recursive: true }, (err, path) => {
            if (err) reject(err);
            fileId = makeFile(dirName, data);
            resolve(fileId);
          });
        }
        return;
      }
      fileId = makeFile(dirName, data);
      resolve(fileId);
    });
  });
};

const makeFile = (dirName, data) => {
  const buffer = Buffer.from(data, 'base64');
  const fileName = uuidv4();

  open(`${dirName}/${fileName}`, 'a', (err, fd) => {
    if (err) reject(err);
    write(fd, buffer, (err, data) => {
      if (err) reject(err);
    });
  });
  return fileName;
};

export default saveFile;

