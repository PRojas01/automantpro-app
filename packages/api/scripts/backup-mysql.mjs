import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir, rename, rm, stat } from "node:fs/promises";
import { createGzip } from "node:zlib";
import { pipeline } from "node:stream/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

/** Creates a private, compressed MySQL dump without exposing credentials in process arguments. */
export async function createMysqlBackup(env = process.env) {
  const defaultsFile = env.MYSQL_DEFAULTS_FILE;
  const database = env.DB_NAME;
  if (!defaultsFile || !database || !/^[a-zA-Z0-9_]+$/.test(database)) throw new Error("Set MYSQL_DEFAULTS_FILE and a valid DB_NAME before backup.");
  if ((await stat(defaultsFile)).mode & 0o077) throw new Error("MySQL option file must have permissions 0600.");
  const directory = resolve(env.BACKUP_DIR || "./backups");
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const output = resolve(directory, `automantpro-${new Date().toISOString().replaceAll(":", "-")}-${randomBytes(4).toString("hex")}.sql.gz`);
  const partial = `${output}.partial`;
  const child = spawn("mysqldump", [`--defaults-extra-file=${resolve(defaultsFile)}`, "--single-transaction", "--quick", "--routines", "--events", "--triggers", "--hex-blob", "--no-tablespaces", "--set-gtid-purged=OFF", database], { stdio: ["ignore", "pipe", "pipe"] });
  child.stderr.resume(); // Do not echo raw client errors: they may contain infrastructure details.
  const completed = new Promise((resolveExit, reject) => {
    child.once("error", () => reject(new Error("mysqldump could not start")));
    child.once("close", code => code === 0 ? resolveExit() : reject(new Error("mysqldump failed")));
  });
  const transfer = pipeline(child.stdout, createGzip(), createWriteStream(partial, { flags: "wx", mode: 0o600 }));
  try {
    await Promise.all([completed, transfer]);
    await rename(partial, output);
    return output;
  } catch (err) {
    child.kill();
    await Promise.allSettled([completed, transfer]);
    await rm(partial, { force: true });
    throw err;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try { console.log(`Backup completed: ${await createMysqlBackup()}`); }
  catch { console.error("Backup failed; no successful backup was published."); process.exitCode = 1; }
}
