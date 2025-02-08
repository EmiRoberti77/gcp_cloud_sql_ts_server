# README: Connecting TypeScript Code to Google Cloud SQL PostgreSQL

This README documents the steps taken to configure and connect a TypeScript application to a **Google Cloud SQL PostgreSQL** instance using public IP. It also includes the final code and details for running it successfully.

---

## Steps to Configure and Connect

### 1️⃣ Setting up the Cloud SQL PostgreSQL Instance

1. **Create an Instance**:

   - Navigate to the Google Cloud Console → **Cloud SQL** → **Create Instance**.
   - Choose **PostgreSQL** and configure the instance (set database name, user, password, etc.).

2. **Enable Public IP**:

   - In the instance details, enable **Public IP connectivity**.
   - Note the **Public IP address** of the instance.

3. **Authorised Networks**:

   - Add your machine’s IP address to the **Authorised Networks** section to allow access.
   - For testing purposes, you can use `0.0.0.0/0` (allow all IPs), but this is not secure for production.

4. **Optional**: Disable SSL if you’re testing without encryption (not recommended for production).

---

### 2️⃣ Setting Up the TypeScript Project

1. **Initialize the Project**:

   ```bash
   mkdir gcp_cloud_sql_ts_service
   cd gcp_cloud_sql_ts_service
   npm init -y
   ```

2. **Install Required Dependencies**:

   ```bash
   npm install pg dotenv
   npm install --save-dev @types/pg
   ```

3. **Create Environment Variables File**:
   - Add a `.env` file in the root directory with the following variables:
     ```env
     user=postgres
     host=PUBLIC_IP_ADDRESS
     password=YOUR_DATABASE_PASSWORD
     database=YOUR_DATABASE_NAME
     port=5432
     rejectUnauthorized=false
     ```

---

### 3️⃣ Writing the TypeScript Code

Here’s the complete code to connect to the database and run a simple `SELECT` query:

```typescript
import dotenv from "dotenv";
dotenv.config();
import { Pool, QueryResultRow } from "pg";

const DELIMITER = () => console.log("--------------------------------");
const ROW = (params: string[]) => console.log(...params);

const rejectUnauthorized = Boolean(process.env.rejectUnauthorized === "true");
console.log("rejectUnauthorized", rejectUnauthorized);
const pool = new Pool({
  user: process.env.user,
  host: process.env.host,
  password: process.env.password,
  database: process.env.database,
  port: parseInt(process.env.port!),
  ssl: {
    rejectUnauthorized,
  },
});

async function selectQuery<T extends QueryResultRow>(
  query: string,
  params?: any[]
): Promise<T[] | undefined> {
  try {
    const client = await pool.connect();
    const response = await client.query<T>(query, params);
    client.release();
    return response.rows;
  } catch (err) {
    console.error(err);
    return undefined;
  }
}

(async () => {
  const SQL = "select * from accounts";
  const accounts = await selectQuery<{ id: string; name: string }>(SQL);
  if (accounts) {
    for (const account of accounts) {
      DELIMITER();
      ROW([account.id, account.name]);
      DELIMITER();
    }
  }
})();
```

---

### 4️⃣ Running the Application

1. **Compile TypeScript**:

   ```bash
   npx tsc
   ```

2. **Run the Application**:
   ```bash
   node dist/server.js
   ```

---

## Key Notes

- **Environment Variables**:

  - Ensure your `.env` file is configured properly with the correct database credentials and public IP.

- **Authorised Networks**:

  - Add your machine’s public IP in the **Authorised Networks** section of your Cloud SQL instance.

- **SSL Settings**:
  - If not using SSL, set `rejectUnauthorized=false` in the `Pool` configuration.
  - For production, always enable SSL to secure the connection.

---

## Troubleshooting

- **`ENOTFOUND` Error**:

  - Ensure the `host` in your `.env` file is the Public IP of the Cloud SQL instance.
  - Verify that your IP is added to the **Authorised Networks**.

- **`08P01` Error**:
  - Ensure the query matches the number of parameters passed.
  - For example, don’t pass `[true]` to a query without placeholders like `$1`.

---

Emi Robert - Happy coding
