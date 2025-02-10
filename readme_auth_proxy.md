# Getting Started with GCP Cloud SQL and Auth Proxy

Google Cloud SQL is a managed database service that makes setting up, managing, and scaling relational databases easy. Using the GCP Auth Proxy adds a layer of security when connecting to Cloud SQL. This guide will walk you through the steps to set up a PostgreSQL instance, connect using the Cloud SQL Auth Proxy, and write some sample TypeScript code to interact with your database. Let’s dive in!

---

## 1️⃣ Setting Up Your Cloud SQL Instance

1. **Create a New PostgreSQL Instance**:
   - Go to the Google Cloud Console → **Cloud SQL** → **Create Instance**.
   - Choose **PostgreSQL** and configure the following:
     - Select a database version (e.g., PostgreSQL 17).
     - Allocate CPU, RAM, and storage based on your needs.
     - Enable **Private IP** for secure communication between resources within your VPC.
<img width="1238" alt="Screenshot 2025-02-10 at 05 48 50" src="https://github.com/user-attachments/assets/8f70e908-e1b8-48fe-80c5-3d76e8ea4cdc" />
<img width="573" alt="Screenshot 2025-02-10 at 05 49 35" src="https://github.com/user-attachments/assets/57dc51f3-06ed-4160-867a-ad50b3efc524" />

2. **Enable Private Services Access**:
   - If using Private IP, you’ll need to set up a **Private Services Access (PSA)** connection.
   - Go to the **VPC network** section → **Private connections** → Create a new connection.
   - Allow Google services to communicate with your VPC network.

  <img width="551" alt="Screenshot 2025-02-10 at 05 50 08" src="https://github.com/user-attachments/assets/620589c4-be9c-4522-b7c7-4a32cc882b0e" />
   <img width="563" alt="Screenshot 2025-02-10 at 05 50 36" src="https://github.com/user-attachments/assets/4a7d4cc6-ea6a-43f2-82c6-c4adb52263a7" />

3. **Configure Authorised Networks**:
   - If you’re using Public IP, add your client’s external IP to the **Authorised Networks** section.
   - For Private IP, ensure your VM or application resides within the same VPC subnet.

   ![Authorised Networks](insert_screenshot_here_3)

---

## 2️⃣ Setting Up the Cloud SQL Auth Proxy

The **Cloud SQL Auth Proxy** acts as a secure bridge between your application and the Cloud SQL instance. Here’s how to set it up:

1. **Download the Proxy**:
   ```bash
   curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.3/cloud-sql-proxy.linux.amd64
   chmod +x cloud-sql-proxy
   ```
   <img width="1228" alt="Screenshot 2025-02-10 at 05 58 58" src="https://github.com/user-attachments/assets/5acec565-bbb1-429f-98c7-86f2d03ad8fe" />
   
   <img width="875" alt="Screenshot 2025-02-10 at 05 53 09" src="https://github.com/user-attachments/assets/80aca8a4-2621-42f5-b6f2-6b5b7ca04083" />
<img width="601" alt="Screenshot 2025-02-10 at 05 55 37" src="https://github.com/user-attachments/assets/97b52064-617f-4f7b-bbd9-88135fdebef2" />
create a .json key and download it
<img width="885" alt="Screenshot 2025-02-10 at 05 56 28" src="https://github.com/user-attachments/assets/3845acd5-31df-4df5-8adf-2ea80e46f590" />
make sure the Cloud SQL Admin Api is acticated as its needed for the proxy to access the database
<img width="640" alt="Screenshot 2025-02-10 at 05 57 40" src="https://github.com/user-attachments/assets/45a634cf-4300-4535-920c-dca8acc0123a" />



2. **Run the Proxy**:
   Use the following command to start the proxy:

   make sure you have a service account to enable auth proxy to work and enable cloud sql api
   ```bash
   ./cloud-sql-proxy kingdom-450018:us-central1:emi-private-db \
     --private-ip \
     --address=0.0.0.0 \
     --port=5432 \
     --credentials-file=key.json
   ```
   - Replace `key.json` with the path to your service account credentials.
<img width="712" alt="Screenshot 2025-02-10 at 05 59 38" src="https://github.com/user-attachments/assets/5abb6c3e-5069-4460-8291-da1dfa2016f1" />

---

## 3️⃣ Writing the TypeScript Code

Here’s some sample TypeScript code to connect to your database and run a query using the Cloud SQL Auth Proxy:

### `.env.proxy`
```env
user=postgres
host=localhost
password=Ferrari77Emi77!
database=emi-db
port=5432
rejectUnauthorized=false
```

### `server.ts`
```typescript
import dotenv from "dotenv";
import path from "path";
import { Pool, QueryResultRow } from "pg";

// Load the correct environment variables
const env = process.env.ENV || "proxy";
const envFile = env === "proxy" ? "../.env.proxy" : "../.env.public";
dotenv.config({
  path: path.resolve(__dirname, envFile),
});

console.log(`Loaded environment file: ${envFile}`);

// Helper functions
const DELIMITER = () => console.log("--------------------------------");
const ROW = (params: string[]) => console.log(...params);

// Configure the PostgreSQL connection
const pool = new Pool({
  user: process.env.user,
  host: process.env.host, // Should point to the proxy (localhost)
  password: process.env.password,
  database: process.env.database,
  port: parseInt(process.env.port!, 10),
  ssl: false, // SSL not required when using the proxy
});

// Query function
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
    console.error("Query error:", err);
    return undefined;
  }
}

// Run the query
(async () => {
  const SQL = "SELECT * FROM accounts";
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

## 4️⃣ Testing the Connection

1. Start the Cloud SQL Auth Proxy:
   ```bash
   ./cloud-sql-proxy kingdom-450018:us-central1:emi-private-db \
     --private-ip \
     --address=0.0.0.0 \
     --port=5432 \
     --credentials-file=key.json
   ```

2. Run the TypeScript application:
   ```bash
   ENV=proxy npm start
   ```

If everything is set up correctly, you’ll see the data from the `accounts` table printed to your console!

---

## 5️⃣ Common Issues and Troubleshooting

- **Error: ECONNRESET or ETIMEDOUT**:
  - Check that the Cloud SQL Auth Proxy is running.
  - Verify your `.env.proxy` file points to `localhost`.
  - Ensure your VM or machine is within the same VPC (for Private IP).

- **Error: `The server does not support SSL connections`**:
  - Set `ssl: false` in your `Pool` configuration when using the proxy.

---

## Conclusion

Setting up GCP Cloud SQL with the Auth Proxy ensures a secure and efficient connection to your database. This guide covered everything from instance setup to writing and testing your TypeScript code. With these steps, you’re ready to build applications with a robust database backend. Happy coding! 🚀
