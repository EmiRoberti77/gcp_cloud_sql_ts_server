import dotenv from "dotenv";
import path from "path";
import { Pool, QueryResultRow } from "pg";
const env = process.env.ENV!;
const envFile = env === "proxy" ? "../.env.proxy" : "../.env.public";
dotenv.config({
  path: path.resolve(__dirname, envFile),
});
console.log(envFile);
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
  ssl:
    env === "proxy"
      ? false
      : {
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
