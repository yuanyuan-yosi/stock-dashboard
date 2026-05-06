const { spawn } = require('child_process');
process.chdir(__dirname);
const child = spawn('node', ['node_modules/vite/bin/vite.js', '--host'], { stdio: 'inherit', shell: true });
child.on('exit', (code) => process.exit(code));
