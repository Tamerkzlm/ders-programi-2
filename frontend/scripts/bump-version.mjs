// frontend/scripts/bump-version.mjs
// Otomatik Sürüm Artırıcı (Örn: 3.0 -> 3.1 -> 3.2 ... veya --major ile 4.0)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const versionFilePath = path.resolve(__dirname, '../version.json');
const packageJsonPath = path.resolve(__dirname, '../package.json');

const args = process.argv.slice(2);
const isMajor = args.includes('--major');
const customVersionIdx = args.indexOf('--set');
const customVersion = customVersionIdx !== -1 ? args[customVersionIdx + 1] : null;

const raw = fs.readFileSync(versionFilePath, 'utf-8');
const data = JSON.parse(raw);

if (customVersion) {
  const parts = customVersion.split('.');
  data.major = parseInt(parts[0], 10) || data.major;
  data.minor = parseInt(parts[1], 10) || 0;
  data.version = `${data.major}.${data.minor}`;
} else if (isMajor) {
  data.major = (Number(data.major) || 2) + 1;
  data.minor = 0;
  data.version = `${data.major}.0`;
} else {
  const currentMinor = Number.isFinite(Number(data.minor)) ? Number(data.minor) : 0;
  data.minor = currentMinor + 1;
  data.version = `${data.major}.${data.minor}`;
}

data.updatedAt = new Date().toISOString().split('T')[0];

fs.writeFileSync(versionFilePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');

if (fs.existsSync(packageJsonPath)) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  pkg.version = `${data.major}.${data.minor}.0`;
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
}

console.log(`✅ Sürüm güncellendi: v${data.version} (${data.updatedAt})`);
