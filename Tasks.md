# 0x04. Files manager

## Tasks
### 0. Redis utils

Inside the folder `utils`, create a file [redis.js](./utils/redis.js) that contains the class `RedisClient`.

`RedisClient` should have:

- [x] the constructor that creates a client to Redis:
  - [x] any error of the redis client must be displayed in the console (you should use `on('error')` of the redis client)
- [x] a function `isAlive` that returns `true` when the connection to Redis is a success otherwise, `false`
- [x] an asynchronous function `get` that takes a string key as argument and returns the Redis value stored for this key
- [x] an asynchronous function `set` that takes a string key, a value and a duration in second as arguments to store it in Redis (with an expiration set by the duration argument)
- [x] an asynchronous function `del` that takes a string key as argument and remove the value in Redis for this key

After the class definition, create and export an instance of `RedisClient` called `redisClient`.
```
user@ubuntu:~$ cat main.js
import redisClient from './utils/redis';

(async () => {
    console.log(redisClient.isAlive());
    console.log(await redisClient.get('myKey'));
    await redisClient.set('myKey', 12, 5);
    console.log(await redisClient.get('myKey'));

    setTimeout(async () => {
        console.log(await redisClient.get('myKey'));
    }, 1000*10)
})();

user@ubuntu:~$ npm run dev main.js
true
null
12
null
user@ubuntu:~$ 
```
    
### 1. MongoDB utils

Inside the folder [utils](./utils/), create a file [db.js](./utils/db.js) that contains the class `DBClient`.

`DBClient` should have:

- [x] the constructor that creates a client to MongoDB:
    - [x] host: from the environment variable `DB_HOST` or default: `localhost`
    - [x] port: from the environment variable `DB_PORT` or default: `27017`
    - [x] database: from the environment variable `DB_DATABASE` or default: `files_manager`
- [x] a function `isAlive` that returns `true` when the connection to MongoDB is a success otherwise, `false`
- [x] an asynchronous function `nbUsers` that returns the number of documents in the collection `users`
- [x] an asynchronous function `nbFiles` that returns the number of documents in the collection `files`

After the class definition, create and export an instance of `DBClient` called `dbClient`.
```sh
user@ubuntu:~$ cat main.js
import dbClient from './utils/db';

const waitConnection = () => {
    return new Promise((resolve, reject) => {
        let i = 0;
        const repeatFct = async () => {
            await setTimeout(() => {
                i += 1;
                if (i >= 10) {
                    reject()
                }
                else if(!dbClient.isAlive()) {
                    repeatFct()
                }
                else {
                    resolve()
                }
            }, 1000);
        };
        repeatFct();
    })
};

(async () => {
    console.log(dbClient.isAlive());
    await waitConnection();
    console.log(dbClient.isAlive());
    console.log(await dbClient.nbUsers());
    console.log(await dbClient.nbFiles());
})();

user@ubuntu:~$ npm run dev main.js
false
true
4
30
user@ubuntu:~$ 
```

### 2. First API

Inside [server.js](./server.js), create the Express server:

- [x] it should listen on the port set by the environment variable `PORT` or by default `5000`
- [x] it should load all routes from the file [routes/index.js](./routes/index.js)

Inside the folder `routes`, create a file [index.js](./routes/index.js) that contains all endpoints of our API:

- [x] `GET /status` => `AppController.getStatus`
- [x] `GET /stats` => `AppController.getStats`

Inside the folder [controllers](./controllers/), create a file [AppController.js](./controllers/AppController.js) that contains the definition of the 2 endpoints:

- [x] `GET /status` should return if Redis is alive and if the DB is alive too by using the 2 utils created previously: `{ "redis": true, "db": true }` with a status code `200`
- [x] `GET /stats` should return the number of users and files in DB: `{ "users": 12, "files": 1231 }` with a status code `200`
    - [x] `users` collection must be used for counting all users
    - [x] `files` collection must be used for counting all files

**Terminal 1:**
```sh
user@ubuntu:~$ npm run start-server
Server running on port 5000
...
```
```sh
Terminal 2:

user@ubuntu:~$ curl 0.0.0.0:5000/status ; echo ""
{"redis":true,"db":true}
user@ubuntu:~$ 
user@ubuntu:~$ curl 0.0.0.0:5000/stats ; echo ""
{"users":4,"files":30}
user@ubuntu:~$ 
```

### 3. Create a new user

Now that we have a simple API, it’s time to add users to our database.

In the file [routes/index.js](./routes/index.js), add a new endpoint:

- [x] `POST /users` => UsersController.postNew
Inside [controllers](./controllers/), add a file [UsersController.js](./controllers/UsersController.js) that contains the new endpoint:

`POST /users` should create a new user in DB:

- [x] To create a user, you must specify an `email` and a `password`
- [x] If the `email` is missing, return an error `Missing email` with a status code 400
- [x] If the `password` is missing, return an error `Missing password` with a status code 400
- [x] If the `email` already exists in DB, return an error `Already exist` with a status code 400
- [x] The `password` must be stored after being hashed in `SHA1`
- [x] The endpoint is returning the new user with only the `email` and the `id `(auto generated by MongoDB) with a status code 201
- [x] The new user must be saved in the collection `users`:
    - [x] `email`: same as the value received
    - [x] `password`: `SHA1` value of the value received
```sh
user@ubuntu:~$ curl 0.0.0.0:5000/users -XPOST -H "Content-Type: application/json" -d '{ "email": "user@ubuntu.com", "password": "toto1234!" }' ; echo ""
{"id":"5f1e7d35c7ba06511e683b21","email":"user@ubuntu.com"}
user@ubuntu:~$ 
user@ubuntu:~$ echo 'db.users.find()' | mongo files_manager
{ "_id" : ObjectId("5f1e7d35c7ba06511e683b21"), "email" : "user@ubuntu.com", "password" : "89cad29e3ebc1035b29b1478a8e70854f25fa2b2" }
user@ubuntu:~$ 
user@ubuntu:~$ 
user@ubuntu:~$ curl 0.0.0.0:5000/users -XPOST -H "Content-Type: application/json" -d '{ "email": "user@ubuntu.com", "password": "toto1234!" }' ; echo ""
{"error":"Already exist"}
user@ubuntu:~$ 
user@ubuntu:~$ curl 0.0.0.0:5000/users -XPOST -H "Content-Type: application/json" -d '{ "email": "user@ubuntu.com" }' ; echo ""
{"error":"Missing password"}
user@ubuntu:~$ 
```


### 4. Authenticate a user

In the file [routes/index.js](./routes/index.js), add 3 new endpoints:

- [x] `GET /connect` => `AuthController.getConnect`
- [x] `GET /disconnect` => `AuthController.getDisconnect`
- [x] `GET /users/me` => `UserController.getMe`

Inside controllers, add a file [AuthController.js](./controllers/AuthController.js) that contains new endpoints:

`GET /connect` should sign-in the user by generating a new authentication token:

- [x] By using the header `Authorization` and the technique of the Basic auth (Base64 of the `<email>:<password>`), find the user associate to this email and with this password (reminder: we are storing the SHA1 of the password)
- [x] If no user has been found, return an error `Unauthorized` with a status code 401
- [x] Otherwise:
    - [x] Generate a random string (using `uuidv4`) as token
    - [x] Create a key: `auth_<token>`
    - [x] Use this key for storing in Redis (by using the `redisClient` create previously) the user ID for 24 hours
    - [x] Return this token: `{ "token": "155342df-2399-41da-9e8c-458b6ac52a0c" }` with a status code 200

Now, we have a way to identify a user, create a token (= avoid to store the password on any front-end) and use this token for 24h to access to the API!

Every authenticated endpoints of our API will look at this token inside the header `X-Token`.

`GET /disconnect` should sign-out the user based on the token:

- [x] Retrieve the user based on the token:
    - [x] If not found, return an error `Unauthorized` with a status code 401
    - [x] Otherwise, delete the token in Redis and return nothing with a status code 204

Inside the file [controllers/UsersController.js](./controllers/UsersController.js) add a new endpoint:

`GET /users/me` should retrieve the user base on the token used:

- [x] Retrieve the user based on the token:
    - [x] If not found, return an error `Unauthorized` with a status code 401
    - [x] Otherwise, return the user object (`email `and `id` only)
```sh
user@ubuntu:~$ curl 0.0.0.0:5000/connect -H "Authorization: Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=" ; echo ""
{"token":"031bffac-3edc-4e51-aaae-1c121317da8a"}
user@ubuntu:~$ 
user@ubuntu:~$ curl 0.0.0.0:5000/users/me -H "X-Token: 031bffac-3edc-4e51-aaae-1c121317da8a" ; echo ""
{"id":"5f1e7cda04a394508232559d","email":"user@ubuntu.com"}
user@ubuntu:~$ 
user@ubuntu:~$ curl 0.0.0.0:5000/disconnect -H "X-Token: 031bffac-3edc-4e51-aaae-1c121317da8a" ; echo ""

user@ubuntu:~$ curl 0.0.0.0:5000/users/me -H "X-Token: 031bffac-3edc-4e51-aaae-1c121317da8a" ; echo ""
{"error":"Unauthorized"}
user@ubuntu:~$ 
```


### 5. First file

In the file [routes/index.js](./routes/index.js), add a new endpoint:

- [x] `POST /files` => `FilesController.postUpload`

Inside [controllers](./controllers/), add a file [FilesController.js](./controllers/FilesController.js) that contains the new endpoint:

`POST /files` should create a new file in DB and in disk:

- [x] Retrieve the user based on the token:
    - [x] If not found, return an error `Unauthorized` with a status code 401
- [x] To create a file, you must specify:
    - [x] `name`: as filename
    - [x] `type`: either `folder`, `file` or `image`
    - [x] `parentId`: (optional) as ID of the parent (default: 0 -> the root)
    - [x] `isPublic`: (optional) as boolean to define if the file is public or not (default: `false`)
    - [x] `data`: (only for `type=file|image`) as Base64 of the file content
- [x] If the `name` is missing, return an error `Missing name` with a status code 400
- [x] If the `type` is missing or not part of the list of accepted type, return an error `Missing type` with a status code 400
- [x] If the `data` is missing and `type != folder`, return an error `Missing data` with a status code 400
- [x] If the `parentId` is set:
    - [x] If no file is present in DB for this `parentId`, return an error `Parent not found` with a status code 400
    - [x] If the file present in DB for this `parentId` is not of type `folder`, return an error `Parent is not a folder` with a status code 400
- [x] The user ID should be added to the document saved in DB - as owner of a file
- [x] If the type is `folder`, add the new file document in the DB and return the new file with a status code 201
- [x] Otherwise:
    - [x] All file will be stored locally in a folder (to create automatically if not present):
        - [x] The relative path of this folder is given by the environment variable `FOLDER_PATH`
        - [x] If this variable is not present or empty, use `/tmp/files_manager` as storing folder path
    - [x] Create a local path in the storing folder with filename a UUID
    - [x] Store the file in clear (reminder: `data` contains the Base64 of the file) in this local path
    - [x] Add the new file document in the collection `files` with these attributes:
        - [x] userId: ID of the owner document (owner from the authentication)
        - [x] `name`: same as the value received
        - [x] `type` same as the value received
        - [x] `isPublic`: same as the value received
        - [x] `parentId`: same as the value received - if not present: 0
        - [x] `localPath`: for a `type=file|image`, the absolute path to the file save in local
    - [x] Return the new file with a status code 201
```sh
user@ubuntu:~$ curl 0.0.0.0:5000/connect -H "Authorization: Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=" ; echo ""
{"token":"f21fb953-16f9-46ed-8d9c-84c6450ec80f"}
user@ubuntu:~$ 
user@ubuntu:~$ curl -XPOST 0.0.0.0:5000/files -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" -H "Content-Type: application/json" -d '{ "name": "myText.txt", "type": "file", "data": "SGVsbG8gV2Vic3RhY2shCg==" }' ; echo ""
{"id":"5f1e879ec7ba06511e683b22","userId":"5f1e7cda04a394508232559d","name":"myText.txt","type":"file","isPublic":false,"parentId":0}
user@ubuntu:~$
user@ubuntu:~$ ls /tmp/files_manager/
2a1f4fc3-687b-491a-a3d2-5808a02942c9
user@ubuntu:~$
user@ubuntu:~$ cat /tmp/files_manager/2a1f4fc3-687b-491a-a3d2-5808a02942c9 
Hello Webstack!
user@ubuntu:~$
user@ubuntu:~$ curl -XPOST 0.0.0.0:5000/files -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" -H "Content-Type: application/json" -d '{ "name": "images", "type": "folder" }' ; echo ""
{"id":"5f1e881cc7ba06511e683b23","userId":"5f1e7cda04a394508232559d","name":"images","type":"folder","isPublic":false,"parentId":0}
user@ubuntu:~$
user@ubuntu:~$ cat image_upload.py
import base64
import requests
import sys

file_path = sys.argv[1]
file_name = file_path.split('/')[-1]

file_encoded = None
with open(file_path, "rb") as image_file:
    file_encoded = base64.b64encode(image_file.read()).decode('utf-8')

r_json = { 'name': file_name, 'type': 'image', 'isPublic': True, 'data': file_encoded, 'parentId': sys.argv[3] }
r_headers = { 'X-Token': sys.argv[2] }

r = requests.post("http://0.0.0.0:5000/files", json=r_json, headers=r_headers)
print(r.json())

user@ubuntu:~$
user@ubuntu:~$ python image_upload.py image.png f21fb953-16f9-46ed-8d9c-84c6450ec80f 5f1e881cc7ba06511e683b23
{'id': '5f1e8896c7ba06511e683b25', 'userId': '5f1e7cda04a394508232559d', 'name': 'image.png', 'type': 'image', 'isPublic': True, 'parentId': '5f1e881cc7ba06511e683b23'}
user@ubuntu:~$
user@ubuntu:~$ echo 'db.files.find()' | mongo files_manager
{ "_id" : ObjectId("5f1e881cc7ba06511e683b23"), "userId" : ObjectId("5f1e7cda04a394508232559d"), "name" : "images", "type" : "folder", "parentId" : "0" }
{ "_id" : ObjectId("5f1e879ec7ba06511e683b22"), "userId" : ObjectId("5f1e7cda04a394508232559d"), "name" : "myText.txt", "type" : "file", "parentId" : "0", "isPublic" : false, "localPath" : "/tmp/files_manager/2a1f4fc3-687b-491a-a3d2-5808a02942c9" }
{ "_id" : ObjectId("5f1e8896c7ba06511e683b25"), "userId" : ObjectId("5f1e7cda04a394508232559d"), "name" : "image.png", "type" : "image", "parentId" : ObjectId("5f1e881cc7ba06511e683b23"), "isPublic" : true, "localPath" : "/tmp/files_manager/51997b88-5c42-42c2-901e-e7f4e71bdc47" }
user@ubuntu:~$
user@ubuntu:~$ ls /tmp/files_manager/
2a1f4fc3-687b-491a-a3d2-5808a02942c9   51997b88-5c42-42c2-901e-e7f4e71bdc47
user@ubuntu:~$
```

### 6. Get and list file

In the file [routes/index.js](./routes/index.js), add 2 new endpoints:

- [x] `GET /files/:id` => `FilesController.getShow`
- [x] `GET /files` => `FilesController.getIndex`

In the file [controllers/FilesController.js](./controllers/FilesController.js), add the 2 new endpoints:

`GET /files/:id` should retrieve the file document based on the ID:

- [x] Retrieve the user based on the token:
    - [x] If not found, return an error `Unauthorized` with a status code 401
- [x] If no file document is linked to the user and the ID passed as parameter, return an error Not found with a status code 404
- [x] Otherwise, return the file document

`GET /files` should retrieve all users file documents for a specific `parentId` and with pagination:

- [x] Retrieve the user based on the token:
    - [x] If not found, return an error `Unauthorized` with a status code 401
- [x] Based on the query parameters `parentId` and `page`, return the list of file document
    - [x] `parentId`:
No validation of parentId needed - if the parentId is not linked to any user folder, returns an empty list
By default, parentId is equal to 0 = the root
    - [x] Pagination:
Each page should be 20 items max
`page` query parameter starts at 0 for the first page. If equals to 1, it means it’s the second page (form the 20th to the 40th), etc…
Pagination can be done directly by the `aggregate` of MongoDB
```sh
bob@dylan:~$ curl 0.0.0.0:5000/connect -H "Authorization: Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=" ; echo ""
{"token":"f21fb953-16f9-46ed-8d9c-84c6450ec80f"}
bob@dylan:~$ 
bob@dylan:~$ curl -XGET 0.0.0.0:5000/files -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""
[{"id":"5f1e879ec7ba06511e683b22","userId":"5f1e7cda04a394508232559d","name":"myText.txt","type":"file","isPublic":false,"parentId":0},{"id":"5f1e881cc7ba06511e683b23","userId":"5f1e7cda04a394508232559d","name":"images","type":"folder","isPublic":false,"parentId":0},{"id":"5f1e8896c7ba06511e683b25","userId":"5f1e7cda04a394508232559d","name":"image.png","type":"image","isPublic":true,"parentId":"5f1e881cc7ba06511e683b23"}]
bob@dylan:~$
bob@dylan:~$ curl -XGET 0.0.0.0:5000/files?parentId=5f1e881cc7ba06511e683b23 -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""
[{"id":"5f1e8896c7ba06511e683b25","userId":"5f1e7cda04a394508232559d","name":"image.png","type":"image","isPublic":true,"parentId":"5f1e881cc7ba06511e683b23"}]
bob@dylan:~$
bob@dylan:~$ curl -XGET 0.0.0.0:5000/files/5f1e8896c7ba06511e683b25 -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""
{"id":"5f1e8896c7ba06511e683b25","userId":"5f1e7cda04a394508232559d","name":"image.png","type":"image","isPublic":true,"parentId":"5f1e881cc7ba06511e683b23"}
bob@dylan:~$
```
     
### 7. File publish/unpublish

In the file [routes/index.js](./routes/index.js), add 2 new endpoints:

- [x] `PUT /files/:id/publish` => `FilesController.putPublish`
- [x] `PUT /files/:id/publish` => `FilesController.putUnpublish`

In the file controllers/FilesController.js, add the 2 new endpoints:

`PUT /files/:id/publish` should set `isPublic` to `true` on the file document based on the ID:

- [x] Retrieve the user based on the token:
    - [x] If not found, return an error `Unauthorized` with a status code 401
- [x] If no file document is linked to the user and the ID passed as parameter, return an error Not found with a status code 404
- [x] Otherwise:
    - [x] Update the value of `isPublic` to `true`
    - [x] And return the file document with a status code 200

`PUT /files/:id/unpublish` should set isPublic to false on the file document based on the ID:

- [x] Retrieve the user based on the token:
    - [x] If not found, return an error `Unauthorized` with a status code 401
- [x] If no file document is linked to the user and the ID passed as parameter, return an error Not found with a status code 404
- [x] Otherwise:
    - [x] Update the value of `isPublic` to `false`
    - [x] And return the file document with a status code 200
```sh
bob@dylan:~$ curl 0.0.0.0:5000/connect -H "Authorization: Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=" ; echo ""
{"token":"f21fb953-16f9-46ed-8d9c-84c6450ec80f"}
bob@dylan:~$ 
bob@dylan:~$ curl -XGET 0.0.0.0:5000/files/5f1e8896c7ba06511e683b25 -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""
{"id":"5f1e8896c7ba06511e683b25","userId":"5f1e7cda04a394508232559d","name":"image.png","type":"image","isPublic":false,"parentId":"5f1e881cc7ba06511e683b23"}
bob@dylan:~$
bob@dylan:~$ curl -XPUT 0.0.0.0:5000/files/5f1e8896c7ba06511e683b25/publish -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""
{"id":"5f1e8896c7ba06511e683b25","userId":"5f1e7cda04a394508232559d","name":"image.png","type":"image","isPublic":true,"parentId":"5f1e881cc7ba06511e683b23"}
bob@dylan:~$ 
bob@dylan:~$ curl -XPUT 0.0.0.0:5000/files/5f1e8896c7ba06511e683b25/unpublish -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""
{"id":"5f1e8896c7ba06511e683b25","userId":"5f1e7cda04a394508232559d","name":"image.png","type":"image","isPublic":false,"parentId":"5f1e881cc7ba06511e683b23"}
bob@dylan:~$ 
```

### 8. File data

In the file [routes/index.js](./routes/index.js), add one new endpoint:

- [x] `GET /files/:id/data` => `FilesController.getFile`

In the file [controllers/FilesController.js](./controllers/FilesController.js   - [x] ), add the new endpoint:

`GET /files/:id/data` should return the content of the file document based on the ID:

- [x] If no file document is linked to the ID passed as parameter, return an error `Not found` with a status code 404
- [x] If the file document (folder or file) is not public (`isPublic: false`) and no user authenticate or not the owner of the file, return an error `Not found` with a status code 404
- [x] If the type of the file document is folder, return an error `A folder doesn't have content` with a status code 400
- [x] If the file is not locally present, return an error `Not found` with a status code 404
- [x] Otherwise:
    - [x] By using the module `mime-types`, get the MIME-type based on the name of the file
    - [x] Return the content of the file with the correct MIME-type
```sh
bob@dylan:~$ curl 0.0.0.0:5000/connect -H "Authorization: Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=" ; echo ""
{"token":"f21fb953-16f9-46ed-8d9c-84c6450ec80f"}
bob@dylan:~$ 
bob@dylan:~$ curl -XPUT 0.0.0.0:5000/files/5f1e879ec7ba06511e683b22/unpublish -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""
{"id":"5f1e879ec7ba06511e683b22","userId":"5f1e7cda04a394508232559d","name":"myText.txt","type":"file","isPublic":false,"parentId":0}
bob@dylan:~$ 
bob@dylan:~$ curl -XGET 0.0.0.0:5000/files/5f1e879ec7ba06511e683b22/data -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""
Hello Webstack!

bob@dylan:~$ curl -XGET 0.0.0.0:5000/files/5f1e879ec7ba06511e683b22/data ; echo ""
{"error":"Not found"}
bob@dylan:~$ 
bob@dylan:~$ curl -XPUT 0.0.0.0:5000/files/5f1e879ec7ba06511e683b22/publish -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""
{"id":"5f1e879ec7ba06511e683b22","userId":"5f1e7cda04a394508232559d","name":"myText.txt","type":"file","isPublic":true,"parentId":0}
bob@dylan:~$ 
bob@dylan:~$ curl -XGET 0.0.0.0:5000/files/5f1e879ec7ba06511e683b22/data ; echo ""
Hello Webstack!

bob@dylan:~$
```
    
### 9. Image Thumbnails

Update the endpoint `POST /files` endpoint to start a background processing for generating thumbnails for a file of type `image`:

- [x] Create a `Bull` queue `fileQueue`
- [x] When a new image is stored (in local and in DB), add a job to this queue with the `userId` and `fileId`

Create a file [worker.js](./worker.js):

- [x] By using the module `Bull`, create a queue `fileQueue`
- [x] Process this queue:
If `fileId` is not present in the job, raise an error `Missing fileId`
If `userId` is not present in the job, raise an error `Missing userId`
If no document is found in DB based on the `fileId` and `userId`, raise an error File not found
By using the module `image-thumbnail`, generate 3 thumbnails with width = 500, 250 and 100 - store each result on the same location of the original file by appending `_<width size>`

Update the endpoint `GET /files/:id/data` to accept a query parameter `size`:

- [x] `size` can be `500`, `250` or `100`
- [x] Based on `size`, return the correct local file
- [x] If the local file doesn’t exist, return an error `Not found` with a status code 404

Terminal 3: (start the worker)
```sh
bob@dylan:~$ npm run start-worker
...
```
Terminal 2:
```sh

bob@dylan:~$ curl 0.0.0.0:5000/connect -H "Authorization: Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=" ; echo ""
{"token":"f21fb953-16f9-46ed-8d9c-84c6450ec80f"}
bob@dylan:~$ 
bob@dylan:~$ python image_upload.py image.png f21fb953-16f9-46ed-8d9c-84c6450ec80f 5f1e881cc7ba06511e683b23
{'id': '5f1e8896c7ba06511e683b25', 'userId': '5f1e7cda04a394508232559d', 'name': 'image.png', 'type': 'image', 'isPublic': True, 'parentId': '5f1e881cc7ba06511e683b23'}
bob@dylan:~$ ls /tmp/files_manager/
2a1f4fc3-687b-491a-a3d2-5808a02942c9   51997b88-5c42-42c2-901e-e7f4e71bdc47   6dc53397-8491-4b7c-8273-f748b1a031cb   6dc53397-8491-4b7c-8273-f748b1a031cb_100   6dc53397-8491-4b7c-8273-f748b1a031cb_250    6dc53397-8491-4b7c-8273-f748b1a031cb_500
bob@dylan:~$ 
bob@dylan:~$ curl -XGET 0.0.0.0:5000/files/5f1e8896c7ba06511e683b25/data -so new_image.png ; file new_image.png
new_image.png: PNG image data, 471 x 512, 8-bit/color RGBA, non-interlaced
bob@dylan:~$ 
bob@dylan:~$ curl -XGET 0.0.0.0:5000/files/5f1e8896c7ba06511e683b25/data?size=100 -so new_image.png ; file new_image.png
new_image.png: PNG image data, 100 x 109, 8-bit/color RGBA, non-interlaced
bob@dylan:~$ 
bob@dylan:~$ curl -XGET 0.0.0.0:5000/files/5f1e8896c7ba06511e683b25/data?size=250 -so new_image.png ; file new_image.png
new_image.png: PNG image data, 250 x 272, 8-bit/color RGBA, non-interlaced
bob@dylan:~$
```
  
### 10. Tests!

Of course, a strong and stable project can not be good without tests.

Create tests for `redisClient` and `dbClient`.

Create tests for each endpoints:

`GET /status`
`GET /stats`
`POST /users`
`GET /connect`
`GET /disconnect`
`GET /users/me`
`POST /files`
`GET /files/:id`
`GET /files` (don’t forget the pagination)
`PUT /files/:id/publish`
`PUT /files/:id/unpublish`
`GET /files/:id/data`


### 11. New user - welcome email

Update the endpoint `POST /users` endpoint to start a background processing for sending a “Welcome email” to the user:

- [x] Create a `Bull` queue `userQueue`
- [x] When a new user is stored (in DB), add a job to this queue with the userId
Update the file worker.js:

- [x] By using the module `Bull`, create a queue `userQueue`
- [x] Process this queue:
    - [x] If `userId` is not present in the job, raise an error `Missing userId`
    - [x] If no document is found in DB based on the `userId`, raise an error `User not found`
    - [x] Print in the console `Welcome <email>!`

In real life, you can use a third party service like Mailgun to send real email. These API are slow, (sending via SMTP is worst!) and sending emails via a background job is important to optimize API endpoint.

