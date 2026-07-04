import { execSync } from "child_process";
import fs from "fs";
import path from "path";

async function globalSetup() {
  console.log("Setting up E2E test database...");
  const dbPath = path.join(process.cwd(), "prisma", "test.db");
  
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  if (fs.existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`);
  if (fs.existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`);
  fs.closeSync(fs.openSync(dbPath, "w"));

  console.log("Running database push...");
  execSync("npx prisma db push --accept-data-loss", {
    env: { ...process.env, DATABASE_URL: "file:./prisma/test.db" },
    stdio: "inherit",
  });

  console.log("Seeding test database...");
  execSync("npx prisma db seed", {
    env: { ...process.env, DATABASE_URL: "file:./prisma/test.db" },
    stdio: "inherit",
  });
}

export default globalSetup;
