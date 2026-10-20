const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? files(`${directory}/${entry.name}`) : [`${directory}/${entry.name}`]);
}
for (const file of ['cypress.config.js', ...files('scripts'), ...files('cypress')].filter(file => file.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status) { console.error(result.stderr); process.exitCode = 1; }
}
if (!process.exitCode) console.log('JavaScript syntax checks passed.');
