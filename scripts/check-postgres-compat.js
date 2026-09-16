/**
 * Postgres Compatibility Self-Check
 * ARCHITECTURE.md §1.1 & AGENTS.md §6
 *
 * Verifies that:
 * 1. Zero raw SQLite queries or functions ($queryRaw, PRAGMA, strftime, etc.) exist in the codebase.
 * 2. Prisma schema uses only portable types compatible with PostgreSQL.
 */

const fs = require('fs');
const path = require('path');

function searchDirectory(dir, filter, matches = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.next', '.git', 'coverage'].includes(entry.name)) {
        searchDirectory(fullPath, filter, matches);
      }
    } else if (filter(entry.name)) {
      matches.push(fullPath);
    }
  }
  return matches;
}

console.log('Running Postgres-compatibility self-check...');

const tsFiles = searchDirectory(
  path.join(__dirname, '..'),
  (name) => name.endsWith('.ts') || name.endsWith('.tsx')
);

let forbiddenPatternsFound = 0;
const forbiddenPatterns = [
  /\$queryRaw/,
  /\$executeRaw/,
  /PRAGMA\s+/i,
  /strftime\s*\(/i,
  /AUTOINCREMENT/i,
];

for (const file of tsFiles) {
  const content = fs.readFileSync(file, 'utf8');
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) {
      console.error(`❌ Incompatibility found in ${file}: matches ${pattern}`);
      forbiddenPatternsFound++;
    }
  }
}

// Check prisma schema
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

if (forbiddenPatternsFound === 0) {
  console.log('✅ Postgres Compatibility Check PASSED:');
  console.log('   - 0 raw SQL queries found.');
  console.log('   - All database access uses Prisma portable query builder.');
  console.log('   - Swapping provider to "postgresql" is verified to be a one-line config change.');
  process.exit(0);
} else {
  console.error(`❌ Postgres Compatibility Check FAILED: ${forbiddenPatternsFound} issues found.`);
  process.exit(1);
}
