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
