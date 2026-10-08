import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function checkRelease(phase, { cwd = process.cwd(), env = process.env, nodeVersion = process.versions.node, loadPrisma } = {}) {
  const result = { phase, node: nodeVersion, npm: String(env.npm_config_user_agent || '').match(/npm\/([\d.]+)/)?.[1] || 'unknown' };
  const fail = (code, instruction) => Object.assign(new Error(instruction), { code });
  if (!['install', 'build', 'start'].includes(phase)) throw fail('INVALID_PHASE', 'Use install, build or start.');
  if (Number(nodeVersion.split('.')[0]) !== 22) throw fail('NODE_VERSION', 'Select Node.js22 in GoDaddy.');
  for (const file of ['server.mjs', 'schema.mjs', 'packages/api/prisma/schema.prisma', 'release-manifest.json']) {
    if (!existsSync(resolve(cwd, file))) throw fail('INCOMPLETE_RELEASE', 'Update GitHub preview from automantpro-app/main; required release files are missing.');
  }
  let manifest;
  try { manifest = JSON.parse(readFileSync(resolve(cwd, 'release-manifest.json'), 'utf8')); }
  catch { throw fail('INVALID_MANIFEST', 'Update the complete release from GitHub.'); }
  const hash = createHash('sha256').update(readFileSync(resolve(cwd, 'server.mjs'))).digest('hex');
  if (hash !== manifest.serverSha256) throw fail('BUNDLE_MISMATCH', 'The preview has mixed versions. Reload the complete release from GitHub.');
  result.sourceSha = manifest.sourceSha;
  if (phase !== 'install') {
    let models;
    try {
      const prisma = (loadPrisma || (() => createRequire(resolve(cwd, 'package.json'))('@prisma/client')))();
      models = prisma.Prisma?.dmmf?.datamodel?.models?.map(model => model.name);
    } catch { throw fail('PRISMA_NOT_GENERATED', 'Run npm ci to generate the release Prisma client; inspect the prisma generate error.'); }
    if (!models || ['User', 'InboundWebhook', 'LocalAgentReply', 'WhatsAppIdentity', 'WhatsAppLinkCode'].some(name => !models.includes(name))) {
      throw fail('PRISMA_STALE', 'Regenerate Prisma from packages/api/prisma/schema.prisma; the preview has an old client.');
    }
    result.prisma = 'generated';
  }
  if (phase === 'start') {
    const jwt = env.JWT_SECRET?.trim();
    if (!jwt || jwt.length < 32 || jwt === 'dev-secret-change-in-production-min-32-chars') {
      throw fail('JWT_CONFIGURATION', 'Configure a persistent JWT_SECRET of at least32 characters in GoDaddy environment variables. Do not paste it into logs or GitHub.');
    }
    if (!env.DATABASE_URL?.trim() && ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'].some(key => !env[key]?.trim())) {
      throw fail('DATABASE_CONFIGURATION', 'Configure DATABASE_URL or the DB_HOST/DB_NAME/DB_USER/DB_PASSWORD variables in GoDaddy.');
    }
    result.configuration = 'present';
  }
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const phase = process.argv[2] || 'build';
  console.log(`[AutoMantPro] checking ${phase}; Node ${process.versions.node}`);
  try { console.log('[AutoMantPro] ' + JSON.stringify(checkRelease(phase))); }
  catch (error) {
    const known = ['INVALID_PHASE', 'NODE_VERSION', 'INCOMPLETE_RELEASE', 'INVALID_MANIFEST', 'BUNDLE_MISMATCH', 'PRISMA_NOT_GENERATED', 'PRISMA_STALE', 'JWT_CONFIGURATION', 'DATABASE_CONFIGURATION'].includes(error.code);
    console.error(`[AutoMantPro] ${known ? error.code + ': ' + error.message : 'RELEASE_CHECK_FAILED: inspect the release files and access permissions.'}`);
    process.exitCode = 1;
  }
}
