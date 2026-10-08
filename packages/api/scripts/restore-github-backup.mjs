import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createGunzip } from "node:zlib";
import { pipeline } from "node:stream/promises";
import { decryptBackup } from "./backup-github.mjs";

const archive = process.env.BACKUP_FILE;
const defaultsFile = process.env.MYSQL_DEFAULTS_FILE;
const database = process.env.RESTORE_DB_NAME;
const key = Buffer.from(process.env.BACKUP_ENCRYPTION_KEY ?? "", "base64");
if (!archive || !defaultsFile || !database || !/^[a-zA-Z0-9_]+_(staging|restore|test)$/.test(database)) throw new Error("Set BACKUP_FILE, MYSQL_DEFAULTS_FILE and an isolated RESTORE_DB_NAME ending in _staging, _restore or _test.");
if (key.length !== 32) throw new Error("BACKUP_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
if ((await stat(defaultsFile)).mode & 0o077) throw new Error("MySQL option file must have permissions 0600.");
const workspace = await mkdtemp(join(tmpdir(), "automantpro-restore-"));
const archiveCopy = resolve(workspace, "restore.sql.gz");
try {
  await decryptBackup(archive, key, archiveCopy);
  const child = spawn("mysql", [`--defaults-extra-file=${resolve(defaultsFile)}`, database], { stdio: ["pipe", "ignore", "pipe"] });
  child.stderr.resume();
  const result = new Promise((resolveExit, reject) => { child.once("error", () => reject(new Error("mysql could not start"))); child.once("close", code => code === 0 ? resolveExit() : reject(new Error("mysql restore failed"))); });
  await Promise.all([result, pipeline(createReadStream(archiveCopy), createGunzip(), child.stdin)]);
  console.log("Encrypted backup restored into the isolated database.");
} finally { await rm(workspace, { recursive: true, force: true }); }
