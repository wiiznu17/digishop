import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Migration Runner for DigiShop
 * This script scans the migrations directory for sub-folders (versions)
 * and runs them in alphabetical order.
 */

// Root path for migrations in dist (where sequelize-cli looks)
const distRoot = path.resolve(__dirname, '../../dist/migrations');

async function run() {
  if (!fs.existsSync(distRoot)) {
    console.error(`[Error] Migrations directory not found at: ${distRoot}`);
    console.error(`Please run "npm run build" in packages/db first.`);
    process.exit(1);
  }

  // Get all version folders (v1.0, v1.1, etc.)
  const versions = fs.readdirSync(distRoot)
    .filter(file => {
        const fullPath = path.join(distRoot, file);
        return fs.statSync(fullPath).isDirectory();
    })
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  if (versions.length === 0) {
    console.log('[Info] No version folders found in dist/migrations. Running default migration folder...');
    // Fallback if they don't use folders yet? Actually, we've moved to folders.
    process.exit(0);
  }

  console.log(`[Info] Found ${versions.length} version folders: ${versions.join(', ')}`);

  for (const version of versions) {
    const versionPath = path.join(distRoot, version);
    console.log(`\n---------------------------------------------------------`);
    console.log(`>>> Migrating version: ${version}`);
    console.log(`>>> Path: ${versionPath}`);
    console.log(`---------------------------------------------------------`);
    
    try {
      // Run the migration for this specific version folder
      execSync(`npx sequelize-cli db:migrate --migrations-path ${versionPath}`, { 
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '../..') // Run from package root
      });
    } catch (error) {
      console.error(`[Error] Failed to migrate version ${version}. Stopping.`);
      process.exit(1);
    }
  }

  console.log('\n[Success] All versioned migrations completed successfully.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
