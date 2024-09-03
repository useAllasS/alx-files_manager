# Alx-Files_Manager Methods and API Documentation

## Contents
- ### [Methods](#methods-1)
    - [isAlive](#isalive)
    - [nbUsers](#nbusers-and-nbfiles)
    - [nbFiles](#nbusers-and-nbfiles)
- ### [Endpoints](#endpoints-1)
    - [/status](#status)
    - [/stats](#stats)
    - [/users](#users)
    - [/connect](#connect)
    - [/disconnect](#disconnect)
    - [/users/me](#usersme)
    - /files
      - [POST](#files)
      - [GET](#files-1)
    - [/files/:id](#filesid)
    - [/files/:id/publish](#filesidpublish)
    - [/files/:id/unpublish](#filesiduppublish)
    - [/files/:id/data](#filesiddata)

## Methods

### `isAlive`

Check `Redis` or `MongoDB` connection

- Redis

```sh
user@ubuntu:~$ cat main.js
import redisClient from './utils/redis';

(async () => {
    console.log(redisClient.isAlive());
})();
```

```sh
user@ubuntu:~$ npm run dev main.js
true
```

- MongoDb

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
})();
```

```sh
user@ubuntu:~$ npm run dev main.js
false
true
```

### `nbUsers` and `nbFiles`

Check number of files and users in the database

```sh
user@ubuntu:~$ cat main.js
import dbClient from './utils/db';

(async () => {
    console.log(await dbClient.nbUsers());
    console.log(await dbClient.nbFiles());
})();
```

```sh
user@ubuntu:~$ npm run dev main.js
4
30
user@ubuntu:~$
```

---

---

## Endpoints

- [/status](#status)
- [/stats](#stats)
- [/users](#users)
- [/connect](#connect)
- [/disconnect](#disconnect)
- [/users/me](#usersme)
- /files
  - [POST](#files)
  - [GET](#files-1)
- [/files/:id](#filesid)
- [/files/:id/publish](#filesidpublish)
- [/files/:id/unpublish](#filesiduppublish)
- [/files/:id/data](#filesiddata)

### `/status`

- Method: `GET`
- Purpose: _Check if redis and mongo are up and running_
- Usage:

```sh
user@ubuntu:~$ curl 0.0.0.0:5000/status ; echo ""
{"redis":true,"db":true}
user@ubuntu:~$
```

### `/stats`

- Method: `GET`
- Purpose: _Retrieves the number of files and users in the database_
- Usage:

```sh
user@ubuntu:~$ curl 0.0.0.0:5000/stats ; echo ""
{"users":4,"files":30}
user@ubuntu:~$
```

### `/users`

- Methods: `POST`
- Purpose: _Creates new user_
- Body: [email, password]
- Usage:

```sh
bob@dylan:~$ curl 0.0.0.0:5000/users -XPOST -H "Content-Type: application/json" -d '{ "email": "bob@dylan.com", "password": "toto1234!" }' ; echo ""
{"id":"5f1e7d35c7ba06511e683b21","email":"bob@dylan.com"}
bob@dylan:~$
```

```sh
bob@dylan:~$ echo 'db.users.find()' | mongo files_manager
{ "_id" : ObjectId("5f1e7d35c7ba06511e683b21"), "email" : "bob@dylan.com", "password" : "89cad29e3ebc1035b29b1478a8e70854f25fa2b2" }
bob@dylan:~$
```

```sh
bob@dylan:~$
bob@dylan:~$ curl 0.0.0.0:5000/users -XPOST -H "Content-Type: application/json" -d '{ "email": "bob@dylan.com", "password": "toto1234!" }' ; echo ""
{"error":"Already exist"}
bob@dylan:~$
```

```sh
bob@dylan:~$ curl 0.0.0.0:5000/users -XPOST -H "Content-Type: application/json" -d '{ "email": "bob@dylan.com" }' ; echo ""
{"error":"Missing password"}
bob@dylan:~$
```

### `/connect`

- Method: `GET`
- Purpose: sign-in the user by generating a new authentication token
- Header: [Authorization]
  - Method: `Basic`
- Usage:

```sh
bob@dylan:~$ curl 0.0.0.0:5000/connect -H "Authorization: Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=" ; echo ""
{"token":"031bffac-3edc-4e51-aaae-1c121317da8a"}
bob@dylan:~$
```

### `/disconnect`

- Method: `GET`
- Purpose: sign-out the user based on the token:
- Header: [x-token]
- Usage:

```sh
bob@dylan:~$ curl 0.0.0.0:5000/disconnect -H "X-Token: 031bffac-3edc-4e51-aaae-1c121317da8a" ; echo ""

bob@dylan:~$
```

### `/users/me`

- Method: `GET`
- Purpose: retrieve the user base on the token used
- Header: [x-token]
- Usage:

```sh
bob@dylan:~$ curl 0.0.0.0:5000/connect -H "Authorization: Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=" ; echo ""
{"token":"031bffac-3edc-4e51-aaae-1c121317da8a"}
bob@dylan:~$
bob@dylan:~$ curl 0.0.0.0:5000/users/me -H "X-Token: 031bffac-3edc-4e51-aaae-1c121317da8a" ; echo ""
{"id":"5f1e7cda04a394508232559d","email":"bob@dylan.com"}
bob@dylan:~$
bob@dylan:~$ curl 0.0.0.0:5000/disconnect -H "X-Token: 031bffac-3edc-4e51-aaae-1c121317da8a" ; echo ""

bob@dylan:~$ curl 0.0.0.0:5000/users/me -H "X-Token: 031bffac-3edc-4e51-aaae-1c121317da8a" ; echo ""
{"error":"Unauthorized"}
bob@dylan:~$
```

### `/files`

- Method: `POST`
- Purpose: create a new file in DB and in disk
- Header: [x-token]
- Body: [
  - `userId`: {type: `String`, required: `true`},
  - `name`: {type: `String`, required: `true`},
  - `type`: {type: `String`, required: `true`, enum: [`file`, `image,` `folder`]},
  - `isPublic`: {type: `Boolean`, default: `false`},
  - `ParentId`: {type: `String`, default: `0`}]
- Usage:

```sh
bob@dylan:~$ curl 0.0.0.0:5000/connect -H "Authorization: Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=" ; echo ""
{"token":"f21fb953-16f9-46ed-8d9c-84c6450ec80f"}
bob@dylan:~$
bob@dylan:~$ curl -XPOST 0.0.0.0:5000/files -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" -H "Content-Type: application/json" -d '{ "name": "myText.txt", "type": "file", "data": "SGVsbG8gV2Vic3RhY2shCg==" }' ; echo ""
{"id":"5f1e879ec7ba06511e683b22","userId":"5f1e7cda04a394508232559d","name":"myText.txt","type":"file","isPublic":false,"parentId":0}
bob@dylan:~$
```

```sh
bob@dylan:~$ ls /tmp/files_manager/
2a1f4fc3-687b-491a-a3d2-5808a02942c9
bob@dylan:~$
bob@dylan:~$ cat /tmp/files_manager/2a1f4fc3-687b-491a-a3d2-5808a02942c9
Hello Webstack!
bob@dylan:~$
```

```sh
bob@dylan:~$ curl -XPOST 0.0.0.0:5000/files -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" -H "Content-Type: application/json" -d '{ "name": "images", "type": "folder" }' ; echo ""
{"id":"5f1e881cc7ba06511e683b23","userId":"5f1e7cda04a394508232559d","name":"images","type":"folder","isPublic":false,"parentId":0}
bob@dylan:~$
```

```sh
bob@dylan:~$ cat image_upload.py
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

bob@dylan:~$
bob@dylan:~$ python image_upload.py image.png f21fb953-16f9-46ed-8d9c-84c6450ec80f 5f1e881cc7ba06511e683b23
{'id': '5f1e8896c7ba06511e683b25', 'userId': '5f1e7cda04a394508232559d', 'name': 'image.png', 'type': 'image', 'isPublic': True, 'parentId': '5f1e881cc7ba06511e683b23'}
bob@dylan:~$
```

```sh
bob@dylan:~$ echo 'db.files.find()' | mongo files_manager
{ "_id" : ObjectId("5f1e881cc7ba06511e683b23"), "userId" : ObjectId("5f1e7cda04a394508232559d"), "name" : "images", "type" : "folder", "parentId" : "0" }
{ "_id" : ObjectId("5f1e879ec7ba06511e683b22"), "userId" : ObjectId("5f1e7cda04a394508232559d"), "name" : "myText.txt", "type" : "file", "parentId" : "0", "isPublic" : false, "localPath" : "/tmp/files_manager/2a1f4fc3-687b-491a-a3d2-5808a02942c9" }
{ "_id" : ObjectId("5f1e8896c7ba06511e683b25"), "userId" : ObjectId("5f1e7cda04a394508232559d"), "name" : "image.png", "type" : "image", "parentId" : ObjectId("5f1e881cc7ba06511e683b23"), "isPublic" : true, "localPath" : "/tmp/files_manager/51997b88-5c42-42c2-901e-e7f4e71bdc47" }
bob@dylan:~$
bob@dylan:~$ ls /tmp/files_manager/
2a1f4fc3-687b-491a-a3d2-5808a02942c9   51997b88-5c42-42c2-901e-e7f4e71bdc47
bob@dylan:~$
```

### `/files/:id`

- Method: `GET`
- Purpose: retrieve the file document based on the ID
- Header: [x-token]
- Usage:

```sh
bob@dylan:~$ curl 0.0.0.0:5000/connect -H "Authorization: Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=" ; echo ""
{"token":"f21fb953-16f9-46ed-8d9c-84c6450ec80f"}
bob@dylan:~$

bob@dylan:~$ curl -XGET 0.0.0.0:5000/files/5f1e8896c7ba06511e683b25 -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""
{"id":"5f1e8896c7ba06511e683b25","userId":"5f1e7cda04a394508232559d","name":"image.png","type":"image","isPublic":true,"parentId":"5f1e881cc7ba06511e683b23"}
bob@dylan:~$
```

### `/files`

- Method: `GET`
- Purpose: retrieve all users file documents for a specific parentId and with pagination
- Header: [x-token]
- Query: [
  - `parentId`: {type: `String`, default: `0`}
  - page: {type: `Number`, default: `0`}
  ]
- Usage:

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
```

### `/files/:id/publish`

- Method: `PUT`
- Purpose: Make a file public and accessible to anyone
- Header: [x-token]
- Usage:

```sh
bob@dylan:~$ curl -XPUT 0.0.0.0:5000/files/5f1e8896c7ba06511e683b25/publish -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""
{"id":"5f1e8896c7ba06511e683b25","userId":"5f1e7cda04a394508232559d","name":"image.png","type":"image","isPublic":true,"parentId":"5f1e881cc7ba06511e683b23"}
bob@dylan:~$
```

### `/files/:id/uppublish`

- Method: `PUT`
- Purpose: Make a file unpublic and not accessible to anyone
- Header: [x-token]
- Usage:

```sh
bob@dylan:~$ curl -XPUT 0.0.0.0:5000/files/5f1e8896c7ba06511e683b25/unpublish -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""
{"id":"5f1e8896c7ba06511e683b25","userId":"5f1e7cda04a394508232559d","name":"image.png","type":"image","isPublic":false,"parentId":"5f1e881cc7ba06511e683b23"}
bob@dylan:~$
```

### `/files/:id/data`
- Method: GET
- Purpose: *return the content of the file document based on the ID*
- Header: [x-token]
- Usage:
```sh
bob@dylan:~$ curl -XPUT 0.0.0.0:5000/files/5f1e879ec7ba06511e683b22/unpublish -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""
{"id":"5f1e879ec7ba06511e683b22","userId":"5f1e7cda04a394508232559d","name":"myText.txt","type":"file","isPublic":false,"parentId":0}
bob@dylan:~$ 
bob@dylan:~$ curl -XGET 0.0.0.0:5000/files/5f1e879ec7ba06511e683b22/data -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""
Hello Webstack!

bob@dylan:~$ curl -XGET 0.0.0.0:5000/files/5f1e879ec7ba06511e683b22/data ; echo ""
{"error":"Not found"}
bob@dylan:~$ 
```
```sh
bob@dylan:~$ curl -XPUT 0.0.0.0:5000/files/5f1e879ec7ba06511e683b22/publish -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""
{"id":"5f1e879ec7ba06511e683b22","userId":"5f1e7cda04a394508232559d","name":"myText.txt","type":"file","isPublic":true,"parentId":0}
bob@dylan:~$ 
bob@dylan:~$ curl -XGET 0.0.0.0:5000/files/5f1e879ec7ba06511e683b22/data ; echo ""
Hello Webstack!

bob@dylan:~$
```