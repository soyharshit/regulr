import fs from "node:fs";
import path from "node:path";

const dbPath = path.resolve(process.argv[2] || "test.db");

for (const suffix of ["", "-wal", "-shm"]) {
  const filePath = `${dbPath}${suffix}`;
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

fs.closeSync(fs.openSync(dbPath, "w"));
