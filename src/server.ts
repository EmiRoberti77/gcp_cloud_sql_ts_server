import dotenv from "dotenv";
dotenv.config();
import { Pool } from "pg";

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

async function testConnection() {
  console.log("test connection start");
  try {
    const client = await pool.connect();
    const query = await client.query("SELECT * from accounts");
    console.log(query.rows);
    client.release();
  } catch (err) {
    console.error(err);
  }
  console.log("test connection end");
}

// testConnection()
//   .then((success) => {
//     console.log("connection success");
//   })
//   .catch((err) => console.log(err));

(async () => {
  await testConnection();
})();
