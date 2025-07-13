module.exports = {
  apps: [
    {
      name: 'hospient-api-live',
      script: 'src/index.js',
      cwd: '/var/www/api.hospient.com',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_file: '/home/ubuntu/logs/hospient-api-live-combined.log',
      out_file: '/home/ubuntu/logs/hospient-api-live-out.log',
      error_file: '/home/ubuntu/logs/hospient-api-live-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z'
    },
    {
      name: 'hospient-api-test',
      script: 'src/index.js',
      cwd: '/var/www/api-test.hospient.com',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      log_file: '/home/ubuntu/logs/hospient-api-test-combined.log',
      out_file: '/home/ubuntu/logs/hospient-api-test-out.log',
      error_file: '/home/ubuntu/logs/hospient-api-test-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z'
    },
    {
      name: 'hospient-admin-live',
      script: 'src/index.js',
      cwd: '/var/www/admin.hospient.com',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      log_file: '/home/ubuntu/logs/hospient-admin-live-combined.log',
      out_file: '/home/ubuntu/logs/hospient-admin-live-out.log',
      error_file: '/home/ubuntu/logs/hospient-admin-live-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z'
    },
    {
      name: 'hospient-app-live',
      script: 'src/index.js',
      cwd: '/var/www/app.hospient.com',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      log_file: '/home/ubuntu/logs/hospient-app-live-combined.log',
      out_file: '/home/ubuntu/logs/hospient-app-live-out.log',
      error_file: '/home/ubuntu/logs/hospient-app-live-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z'
    }
  ]
};