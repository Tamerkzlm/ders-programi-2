// appStore.js içindeki gerçek okul verisini (REAL_TEACHERS / REAL_CLASSROOMS) kıyaslama için JSON'a çıkarır.
// Kullanım: node backend/bench/extract_sample.mjs > backend/bench/sample_school.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, '../../frontend/src/store/appStore.js'), 'utf8');

function grabArray(name) {
  const start = src.indexOf(`const ${name} = [`);
  if (start < 0) throw new Error(`${name} bulunamadı`);
  let i = src.indexOf('[', start), depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '[') depth++;
    else if (src[j] === ']') { depth--; if (depth === 0) return src.slice(i, j + 1); }
  }
  throw new Error(`${name} kapanmadı`);
}

const teachers = Function(`return ${grabArray('REAL_TEACHERS')}`)();
const classrooms = Function(`return ${grabArray('REAL_CLASSROOMS')}`)();

const out = {
  settings: { days: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'], periodsPerDay: 8 },
  teachers,
  classrooms,
  softConstraints: { minimizeGaps: true, gapPenalty: 40, earlyStart: true, earlyStartPenalty: 20, avoidStemLate: true, stemLatePenalty: 35 },
  hardConstraints: {
    enforceMaxGaps: true, maxGapsPerDay: 2, enforceDailyBalance: true, maxDailyHourDiff: 2, minDailyHours: 3,
    enforceConsecutiveClassRules: true, enforceIntensiveRules: true, maxHoursPerIntensiveCourse: 4, solverTimeout: 60,
  },
  pinnedSlots: [],
};
process.stdout.write(JSON.stringify(out, null, 1));
