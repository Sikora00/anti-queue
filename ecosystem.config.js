module.exports = {
  apps: [
    {
      name: 'api',
      script: './dist/main-api.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      env_development: {
        NODE_ENV: 'development',
      },
    },
    {
      name: 'worker',
      script: './dist/main-worker.js',
      instances: 2, // Default to 2 workers, can be scaled with: pm2 scale worker 5
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      env_development: {
        NODE_ENV: 'development',
      },
    },
  ],
};
