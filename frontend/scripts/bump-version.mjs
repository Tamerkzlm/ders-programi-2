// frontend/scripts/bump-version.mjs
// Otomatik Sürüm Artırıcı (2.4 -> 2.41 -> 2.42 ... veya --major ile 3.0)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const versionFilePath = path.resolve(__dirname, '../version.json');

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
  // 2.4 -> 2.41 -> 2.42 ...
  const currentMinor = Number(data.minor) || 40;
  data.minor = currentMinor < 40 ? currentMinor * 10 + 1 : currentMinor + 1;
  data.version = `${data.major}.${data.minor}`;
}

data.updatedAt = new Date().toISOString().split('T')[0];

fs.writeFileSync(versionFilePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
console.log(`✅ Sürüm güncellendi: v${data.version} (${data.updatedAt})`);
