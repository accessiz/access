import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const ENV_PATH = path.resolve(process.cwd(), '.env.local');

function parseEnvWithCommentedOld(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const map = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const activeMatch = trimmed.match(/^([A-Z0-9_]+)=(.*)$/);
    if (activeMatch) {
      map[activeMatch[1]] = activeMatch[2];
      continue;
    }

    const oldMatch = trimmed.match(/^#\s*OLD_([A-Z0-9_]+)=(.*)$/);
    if (oldMatch) {
      map[`OLD_${oldMatch[1]}`] = oldMatch[2];
    }
  }

  return map;
}

function required(name, source) {
  const val = source[name] ?? process.env[name];
  if (!val) {
    throw new Error(`Missing required env: ${name}`);
  }
  return val;
}

async function fetchOpenApiTables(baseUrl, serviceKey, schema = 'public') {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/rest/v1/`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: 'application/openapi+json',
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAPI fetch failed (${schema}): ${res.status} ${body}`);
  }

  const spec = await res.json();
  const paths = spec?.paths ?? {};

  const tableNames = Object.keys(paths)
    .map((p) => p.replace(/^\//, '').split('(')[0])
    .filter((name) => name && !name.startsWith('rpc/'))
    .filter((name, index, arr) => arr.indexOf(name) === index)
    .sort();

  return tableNames;
}

async function fetchAllRows(client, schema, table, pageSize = 1000) {
  const rows = [];
  let from = 0;

  while (true) {
    const { data, error } = await client
      .schema(schema)
      .from(table)
      .select('*')
      .range(from, from + pageSize - 1);

    if (error) throw error;

    if (!data || data.length === 0) break;

    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

async function writeRows(client, schema, table, rows) {
  if (!rows.length) return { mode: 'skip-empty' };

  const chunks = [];
  for (let i = 0; i < rows.length; i += 500) {
    chunks.push(rows.slice(i, i + 500));
  }

  let upsertWorked = true;
  for (const chunk of chunks) {
    const { error } = await client.schema(schema).from(table).upsert(chunk);
    if (error) {
      upsertWorked = false;
      break;
    }
  }

  if (upsertWorked) return { mode: 'upsert' };

  for (const chunk of chunks) {
    const { error } = await client.schema(schema).from(table).insert(chunk);
    if (error) {
      throw error;
    }
  }

  return { mode: 'insert' };
}

function formatError(error) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

async function migrateSchema({ schema, oldClient, newClient, tables }) {
  const pending = [...tables];
  const migrated = [];
  const failed = new Map();

  for (let pass = 1; pass <= 5 && pending.length > 0; pass++) {
    const passStartPending = [...pending];
    let progressed = false;

    for (const table of passStartPending) {
      try {
        const rows = await fetchAllRows(oldClient, schema, table);
        const { mode } = await writeRows(newClient, schema, table, rows);
        migrated.push({ schema, table, rows: rows.length, mode, pass });
        pending.splice(pending.indexOf(table), 1);
        failed.delete(table);
        progressed = true;
        console.log(`✅ [${schema}.${table}] ${rows.length} rows via ${mode}`);
      } catch (error) {
        const message = formatError(error);
        failed.set(table, message);
        console.log(`⚠️  [${schema}.${table}] deferred (pass ${pass}): ${message}`);
      }
    }

    if (!progressed) break;
  }

  return { migrated, pending, failed };
}

async function main() {
  const env = parseEnvWithCommentedOld(ENV_PATH);

  const newUrl = required('NEXT_PUBLIC_SUPABASE_URL', env);
  const newServiceKey = required('SUPABASE_SERVICE_KEY', env);
  const oldUrl = required('OLD_NEXT_PUBLIC_SUPABASE_URL', env);
  const oldServiceKey = required('OLD_SUPABASE_SERVICE_KEY', env);

  const oldClient = createClient(oldUrl, oldServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const newClient = createClient(newUrl, newServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const publicTables = await fetchOpenApiTables(oldUrl, oldServiceKey, 'public');

  console.log(`\nDiscovered public tables: ${publicTables.length}`);

  const publicResult = await migrateSchema({
    schema: 'public',
    oldClient,
    newClient,
    tables: publicTables,
  });

  const report = {
    at: new Date().toISOString(),
    source: oldUrl,
    target: newUrl,
    public: {
      discovered: publicTables.length,
      migrated: publicResult.migrated,
      pending: publicResult.pending,
      failed: Object.fromEntries(publicResult.failed),
    },
  };

  const outDir = path.resolve(process.cwd(), 'tmp');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'supabase-migration-report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('\n================ Migration Summary ================');
  console.log(`Public migrated: ${publicResult.migrated.length}/${publicTables.length}`);
  console.log(`Public pending: ${publicResult.pending.length}`);
  console.log(`Report: ${outPath}`);

  if (publicResult.pending.length > 0) {
    process.exitCode = 2;
  }
}

main().catch((err) => {
  console.error('Migration failed:', formatError(err));
  process.exit(1);
});
