import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { appendFile, open, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { createMysqlBackup } from "./backup-mysql.mjs";

const MAGIC = Buffer.from("AMPBK1");
const API = "https://api.github.com";
const UPLOADS = "https://uploads.github.com";

function encryptionKey(raw) {
  const key = Buffer.from(raw ?? "", "base64");
  if (key.length !== 32) throw new Error("BACKUP_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  return key;
}
function githubRepo(raw) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(raw ?? "")) throw new Error("Set BACKUP_GITHUB_REPO as owner/repository.");
  return raw;
}
async function responseJson(response, label) {
  if (!response.ok) throw new Error(`${label} failed with HTTP ${response.status}.`);
  return response.json();
}

/** Encrypts as AMPBK1 + IV + ciphertext + GCM authentication tag. */
export async function encryptBackup(source, key, destination = `${source}.ampenc`) {
  const input = resolve(source); const output = resolve(destination); const temporary = `${output}.partial`;
  const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", key, iv);
  await writeFile(temporary, Buffer.concat([MAGIC, iv]), { flag: "wx", mode: 0o600 });
  try {
    await pipeline(createReadStream(input), cipher, createWriteStream(temporary, { flags: "a", mode: 0o600 }));
    await appendFile(temporary, cipher.getAuthTag(), { mode: 0o600 });
    await rename(temporary, output);
    return output;
  } catch (err) { await rm(temporary, { force: true }); throw err; }
}

/** Decrypts only a complete authenticated archive; intended for isolated restore drills. */
export async function decryptBackup(source, key, destination) {
  const input = resolve(source); const output = resolve(destination); const temporary = `${output}.partial`;
  const info = await stat(input);
  if (info.size <= MAGIC.length + 12 + 16) throw new Error("Backup archive is too small.");
  const handle = await open(input, "r");
  try {
    const header = Buffer.alloc(MAGIC.length + 12); const tag = Buffer.alloc(16);
    await handle.read(header, 0, header.length, 0);
    await handle.read(tag, 0, tag.length, info.size - tag.length);
    if (!header.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error("Backup archive format is not recognized.");
    const decipher = createDecipheriv("aes-256-gcm", key, header.subarray(MAGIC.length)); decipher.setAuthTag(tag);
    await pipeline(createReadStream(input, { start: header.length, end: info.size - tag.length - 1 }), decipher, createWriteStream(temporary, { flags: "wx", mode: 0o600 }));
    await rename(temporary, output);
    return output;
  } catch (err) { await rm(temporary, { force: true }); throw err; }
  finally { await handle.close(); }
}

async function releaseForToday(repo, token, fetcher) {
  const tag = `db-backup-${new Date().toISOString().slice(0, 10)}`;
  const headers = { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" };
  const existing = await fetcher(`${API}/repos/${repo}/releases/tags/${tag}`, { headers });
  if (existing.ok) return responseJson(existing, "GitHub release lookup");
  if (existing.status !== 404) return responseJson(existing, "GitHub release lookup");
  const created = await fetcher(`${API}/repos/${repo}/releases`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ tag_name: tag, name: `Respaldo MySQL ${tag.slice(-10)}`, draft: false, prerelease: false, generate_release_notes: false }) });
  if (created.status === 422) return responseJson(await fetcher(`${API}/repos/${repo}/releases/tags/${tag}`, { headers }), "GitHub release lookup after concurrent creation");
  return responseJson(created, "GitHub release creation");
}

export async function uploadEncryptedBackup({ file, repo, token, fetcher = fetch }) {
  const headers = { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" };
  const repository = await responseJson(await fetcher(`${API}/repos/${repo}`, { headers }), "GitHub backup repository lookup");
  if (repository.private !== true) throw new Error("BACKUP_GITHUB_REPO must be private.");
  const release = await releaseForToday(repo, token, fetcher);
  const uploadUrl = String(release.upload_url ?? "").replace(/\{\?name,label\}$/, "");
  if (!uploadUrl.startsWith(UPLOADS)) throw new Error("GitHub did not return a valid release upload URL.");
  const encrypted = await stat(file);
  const response = await fetcher(`${uploadUrl}?name=${encodeURIComponent(basename(file))}`, { method: "POST", headers: { ...headers, "Content-Type": "application/octet-stream", "Content-Length": String(encrypted.size) }, body: createReadStream(file), duplex: "half" });
  return responseJson(response, "GitHub backup asset upload");
}

export async function backupToGitHub(env = process.env, fetcher = fetch) {
  const token = env.BACKUP_GITHUB_TOKEN;
  if (!token) throw new Error("Set BACKUP_GITHUB_TOKEN outside the repository.");
  const key = encryptionKey(env.BACKUP_ENCRYPTION_KEY);
  const repo = githubRepo(env.BACKUP_GITHUB_REPO);
  const dump = await createMysqlBackup(env);
  const encrypted = resolve(dirname(dump), `${basename(dump)}.ampenc`);
  try {
    await encryptBackup(dump, key, encrypted);
    await rm(dump, { force: true });
    const asset = await uploadEncryptedBackup({ file: encrypted, repo, token, fetcher });
    await rm(encrypted, { force: true });
    return String(asset.browser_download_url ?? "uploaded");
  } catch (err) { throw err; }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try { console.log(`Encrypted backup uploaded: ${await backupToGitHub()}`); }
  catch (err) { console.error(`GitHub backup failed: ${(err instanceof Error ? err.message : "unknown error")}`); process.exitCode = 1; }
}
