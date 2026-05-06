module.exports = {
  apps: [
    {
      name: 'stock-api',
      script: 'server/index.js',
      cwd: __dirname,
      autorestart: true,
      max_restarts: 10,
    },
    {
      name: 'stock-vite',
      script: 'node_modules/vite/bin/vite.js',
      args: '--host',
      cwd: __dirname,
      interpreter: 'node',
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
