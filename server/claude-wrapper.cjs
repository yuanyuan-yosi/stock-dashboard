// Wrapper to call claude CLI with proper encoding on Windows
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const message = process.env.CLAUDE_MSG;
const flags = process.argv.slice(2).join(' ');

if (!message) {
  console.error('Usage: CLAUDE_MSG="..." node claude-wrapper.cjs [flags]');
  process.exit(1);
}

// Write message to temp file
const tmpFile = path.join(os.tmpdir(), `claude-msg-${Date.now()}.txt`);
fs.writeFileSync(tmpFile, message, 'utf-8');

const isWin = process.platform === 'win32';
const cmd = flags ? `claude ${flags}` : 'claude';
const child = spawn(cmd, {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: process.env.USERPROFILE || process.env.HOME || '.',
  shell: isWin,
  windowsHide: true,
});

const fileStream = fs.createReadStream(tmpFile);
fileStream.pipe(child.stdin);

let stdout = '';
let stderr = '';

child.stdout.on('data', (chunk) => { stdout += chunk; });
child.stderr.on('data', (chunk) => { stderr += chunk; });

child.on('close', (code) => {
  try { fs.unlinkSync(tmpFile); } catch {}
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  try { fs.unlinkSync(tmpFile); } catch {}
  process.stderr.write(err.message);
  process.exit(1);
});
