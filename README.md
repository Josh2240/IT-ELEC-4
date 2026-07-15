# IT-ELEC-4

## Docker Compose (backend + MySQL)

A Docker Compose file is included to run the backend together with a MySQL database for local development.

To start both services:

```bash
docker compose up --build
```

The backend will be available on port 4000 and the MySQL server on 3306. Copy `backend/.env.example` to `backend/.env` if you need to customize credentials when not using Docker.

To stop and remove containers:

```bash
docker compose down
```

## Frontend running 

A command must be at the center of the code when it runs or when it's needed to run. 

To start the program

```bash
npm run build
```

Then, you need to follow;

```bash
npm start
```

It is needed if you are running on the local server and you want to show the project more efficiently

Another idea is making it on a tester mode;

```bash
npm run dev
```
It will runs the developer's perspective, and to have a free will to see the token, item, sources, and other important files that needs to be fix.

# Information

## About
    the Information System for Basic Education is made for the educators (exclusively).

# ADDITIONAL:
 - in .env.example, the;

```
 DB_HOST=db
DB_USER=root
DB_PASS=example
DB_NAME=pclu_employee_db
DB_PORT=3306
JWT_SECRET=change-this-secret-in-production
PORT=4000
```

```changes to

DB_HOST=localhost
   DB_USER=root
   DB_PASS=example
   DB_NAME=pclu_employee_db
   PORT=4000
   ```

   :this is to retry the frontend, and backend to see the overview result of the system.

   :if this is not working, the old command of .env.example must be at the file, not the new one

   # FIRST TRY: 
    - not working