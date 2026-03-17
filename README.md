# Backend Developer Test - Node.js + TypeScript

A REST API built with Node.js, Express, and Typescript that accepts CSV file uploads, parses and save the data to MySQL and returns paginated results.

## Tech Stack

| Layer       | Technology      |
| ----------- | --------------- |
| Runtime     | Node.js 22      |
| Framework   | Express 4       |
| Language    | Typescript 5    |
| Database    | MySql via Xampp |
| File Upload | Multer          |
| CSV Parsing | csv-parse       |

## Prerequisites

- Node.js 22
- XAMPP with MySQL running on port 3307

## Project Structure

```
src/
├── controllers/         # Route handlers
|   └── csvController.ts
├── middleware/          # Custom middleware
|   ├── errorHandler.ts
|   ├── requestLogger.ts
|   └── uploadMiddleware.ts
├── routes/              # Express routers
|   └── csvRoutes.ts
├── types/               # Shared TypeScript types
|   └── index.ts
├── app.ts               # Express app setup
└── index.ts             # Entry point
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Update `.env` with your values:

```bash
PORT=8000
NODE_ENV=development

# MYSQL - XAMPP defaults
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=
DB_NAME=dev_test

# CORS - set to your FRONTEND URL
ALLOWED_ORIGINS=http://localhost:3001
```

### 3. Set up the database

Open **phpMyAdmin** at `http://localhost/phpmyadmin` and run:

```sql
CREATE DATABASE IF NOT EXISTS dev_test;

USE dev_test;

CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  first_name  VARCHAR(100),
  last_name   VARCHAR(100),
  email       VARCHAR(150),
  gender      VARCHAR(20),
  ip_address  VARCHAR(45),
  company     VARCHAR(150),
  city        VARCHAR(100),
  title       VARCHAR(100),
  website     TEXT
);
```

### 4. Start the server

**Development** (hot reload):

```bash
npm run dev
```

**Production:**

```bash
npm run build
npm start
```

Server runs at `http://localhost:3000`

## API Endpoints

Base Url: `http://localhost:3000`

## POST `/api/users/import`

Upload a CSV file, save all rows to the users table and return the first page of results.

**CSV Column Order** (must match the `users` table).

```bash
first_name, last_name, email, gender, ip_address, company, city, title, website
```

Request:

```
Content-Type: multipart/form-data
Field Name:   file
```

```bash
curl -X POST "http://localhost:3000/api/users/import" \
  -F "file=@users.csv"
```

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Parsed and saved 1000 row(s) to the users table.",
  "data": {
    "dataId": "csv_1773714508499_yiicek",
    "saved": 1000,
    "columns": [
      "id",
      "first_name",
      "last_name",
      "email",
      "gender",
      "ip_address",
      "company",
      "city",
      "title",
      "website"
    ],
    "rows": [
      {
        "id": "1",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "gender": "Male",
        "ip_address": "192.168.1.1",
        "company": "Example Biz",
        "city": "Sydney",
        "title": "Mechanical Engineer",
        "website": "https://example.com"
      },
      ...
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalRows": 1000,
    "totalPages": 100,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Response** `500 Internal Server Error` - Wrong csv file format.

```json
{
  "success": false,
  "error": "Failed to import CSV: Column 'first_name' cannot be null"
}
```

**Response** `400 Bad Request` - No file selected.

```json
{
  "success": false,
  "error": "error": "No file uploaded. Send a CSV as form-data with key \"file\""
}
```

## GET `/api/users/import/:dataId?page=:page&limit=:limit`

Retrieve a specific page of a previously uploaded CSV using `dataId` returned from the upload.

```bash
curl "http://localhost:3000/api/users/import/csv_1710000000000_abc123?page=2&limit=10"
```

Query Parameters
| Param | Default | Description |
| ------- | ------- | --------- |
| `page` | `1` | Page Number |
| `limit` | `10` | Rows per page |

**Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "columns": [
      "id",
      "first_name",
      "last_name",
      "email",
      "gender",
      "ip_address",
      "company",
      "city",
      "title",
      "website"
    ],
    "rows": [
      {
        "id": "1",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "gender": "Male",
        "ip_address": "192.168.1.1",
        "company": "Example Biz",
        "city": "Sydney",
        "title": "Mechanical Engineer",
        "website": "https://example.com"
      },
      ...
    ]
  },
  "pagination": {
    "page": 2,
    "limit": 10,
    "totalRows": 1000,
    "totalPages": 100,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Response** `404 Not Found` - Incorrect `dataId`

```json
{
  "success": false,
  "error": "Data not found. Please re-upload your CSV."
}
```
