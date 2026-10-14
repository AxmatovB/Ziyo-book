// Generates legal/THIRD_PARTY_LICENSES.md from the packages that are actually installed.
//
//   npm run licenses
//
// "Runtime" packages are `dependencies` of package.json and everything they pull in: this is the
// code that ships to visitors, so each one gets its full license text. Build tools
// (devDependencies and their dependencies) never ship; they are summarised by license.
// Re-run after changing dependencies.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'legal/THIRD_PARTY_LICENSES.md');
const rootPkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

/** Finds node_modules/<name> the way Node does: next to the requiring package, then in parent folders. */
function resolveDir(name, fromDir) {
  let dir = fromDir;
  for (;;) {
    const candidate = join(dir, 'node_modules', name);
    if (existsSync(join(candidate, 'package.json'))) return candidate;
    const parent = dirname(dir);
    if (parent === dir || !parent.startsWith(root)) return null;
    dir = parent;
  }
}

const loadPackage = (dir) => JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));

/** Every package reachable through `dependencies` (and optionalDependencies that are installed). */
function closure(roots) {
  const seen = new Map(); // dir -> package.json
  const visit = (name, fromDir) => {
    const dir = resolveDir(name, fromDir);
    if (!dir || seen.has(dir)) return;
    const pkg = loadPackage(dir);
    seen.set(dir, pkg);
    for (const dep of Object.keys({ ...pkg.dependencies, ...pkg.optionalDependencies })) visit(dep, dir);
  };
  for (const name of roots) visit(name, root);
  return seen;
}

function describe(dir, pkg) {
  const license = typeof pkg.license === 'string' ? pkg.license : pkg.license?.type ?? (pkg.licenses ?? []).map((l) => l.type).join(' OR ') ?? '';
  const file = readdirSync(dir).find((f) => /^(licen[sc]e|copying)(\.|$)/i.test(f));
  const repo = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url ?? pkg.homepage ?? '';
  return {
    name: pkg.name,
    version: pkg.version,
    license: license || 'UNKNOWN',
    text: file ? readFileSync(join(dir, file), 'utf8').trim() : null,
    repo: repo.replace(/^git\+/, '').replace(/\.git$/, ''),
  };
}

const runtimeDirs = closure(Object.keys(rootPkg.dependencies ?? {}));
const allDirs = closure([...Object.keys(rootPkg.dependencies ?? {}), ...Object.keys(rootPkg.devDependencies ?? {})]);

const runtime = [...runtimeDirs].map(([dir, pkg]) => describe(dir, pkg)).sort((a, b) => a.name.localeCompare(b.name));
const tools = [...allDirs].filter(([dir]) => !runtimeDirs.has(dir)).map(([dir, pkg]) => describe(dir, pkg));

// direct build tools get their own rows; the rest is summarised per license
const directTools = tools.filter((p) => p.name in (rootPkg.devDependencies ?? {})).sort((a, b) => a.name.localeCompare(b.name));
const otherTools = tools.filter((p) => !(p.name in (rootPkg.devDependencies ?? {})));
const toolLicenseCounts = otherTools.reduce((acc, p) => ((acc[p.license] = (acc[p.license] ?? 0) + 1), acc), {});

const table = (rows) =>
  ['| Paket | Versiya | Litsenziya | Manba |', '|---|---|---|---|', ...rows.map((p) => `| ${p.name} | ${p.version} | ${p.license} | ${p.repo || '-'} |`)].join('\n');

// identical license texts are printed once
const byText = new Map();
for (const p of runtime) {
  const key = p.text ?? `__none__${p.license}`;
  if (!byText.has(key)) byText.set(key, { text: p.text, license: p.license, packages: [] });
  byText.get(key).packages.push(`${p.name}@${p.version}`);
}

const parts = [
  '# Uchinchi tomon litsenziyalari',
  '',
  `Bu fayl \`npm run licenses\` buyrug'i bilan avtomatik yaratilgan (${new Date().toISOString().slice(0, 10)}). Qo'lda tahrirlamang: bog'liqliklarni o'zgartirgach buyruqni qayta ishga tushiring.`,
  '',
  "Ziyo Kutubxonasi quyidagi ochiq kodli paketlardan foydalanadi. Ularning litsenziyalari talab qiladigan mualliflik eslatmalari shu yerda saqlanadi.",
  '',
  `## Sayt bilan birga tarqatiladigan paketlar (${runtime.length} ta)`,
  '',
  "Bular saytni ochgan foydalanuvchining brauzeriga yetib boradigan kod.",
  '',
  table(runtime),
  '',
  `## Qurish vositalari (${tools.length} ta, foydalanuvchiga yetib bormaydi)`,
  '',
  "Faqat saytni yig'ish va tekshirish uchun ishlatiladi. Asosiy vositalar:",
  '',
  table(directTools),
  '',
  `Ularning boshqa ${otherTools.length} ta bog'liq paketi litsenziyalari bo'yicha: ${Object.entries(toolLicenseCounts).sort((a, b) => b[1] - a[1]).map(([l, n]) => `${l} (${n})`).join(', ')}.`,
  '',
  '## Shriftlar',
  '',
  '- **Cormorant Garamond** va **Inter**: SIL Open Font License 1.1. Ular Google Fonts orqali yuklanadi, ya\'ni foydalanuvchining brauzeri Google serveriga murojaat qiladi.',
  '',
  '## Litsenziya matnlari (sayt bilan tarqatiladigan paketlar uchun)',
  '',
];

for (const { text, license, packages } of byText.values()) {
  parts.push(`### ${license}`, '', `Paketlar: ${packages.join(', ')}`, '', text ? '```text\n' + text + '\n```' : "_Paket alohida litsenziya faylini o'z ichiga olmaydi; litsenziya `package.json` da ko'rsatilgan._", '');
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, parts.join('\n'));
console.log(`Wrote ${OUT}`);
console.log(`  runtime packages: ${runtime.length}, build tools: ${tools.length}, distinct license texts: ${byText.size}`);
console.log('  runtime licenses:', [...new Set(runtime.map((p) => p.license))].join(', '));
const unknown = [...runtime, ...tools].filter((p) => /UNKNOWN|UNLICENSED/i.test(p.license));
if (unknown.length) console.warn('  Check manually:', unknown.map((p) => p.name).join(', '));
