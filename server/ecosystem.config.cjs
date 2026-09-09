module.exports = {
  apps: [
    {
      name: "aupairconnect-api",
      script: "./dist/server.js",
      instances: 1,          // fork mode no Windows é mais estável
      exec_mode: "fork",     // cluster mode tem bug de porta no Windows com ESM
      watch: false,
      max_memory_restart: "1G",
      node_args: "--max-old-space-size=1024",
      env: {
        NODE_ENV: "development",
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    }
  ]
};
