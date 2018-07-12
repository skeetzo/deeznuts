module.exports = {
  // Applications part
  apps : [{
    name      : 'deeznuts',
    script    : 'npm',
    args      : 'start',
    cwd       : './alexdeeznuts',
    instances : "max",
    exec_mode : "cluster",
    env: {
      NODE_ENV: 'development'
    },
    env_production : {
      NODE_ENV: 'production'
    },
    env_staging : {
      NODE_ENV : "staging",
    }
  }],
  deploy : {
    "development" : {
      user : "skeetzo",
      host : "76.91.217.22",
      ref  : "origin/master",
      repo : "git@github.com:skeetzo/deeznuts-hades.git",
      path : "/home/skeetzo/Sites/alexdeeznuts",
      "post-deploy" : "npm install && pm2 startOrRestart ecosystem.config.js",
      env  : {
        NODE_ENV: "development"
      }
    },
    "staging" : {
      user : "skeetzo",
      host : "76.91.217.22",
      ref  : "origin/master",
      repo : "git@github.com:skeetzo/deeznuts-hades.git",
      path : "/home/skeetzo/Sites/alexdeeznuts",
      "post-deploy" : "npm install && pm2 startOrRestart ecosystem.config.js --env staging",
      env  : {
        NODE_ENV: "staging"
      }
    },
    "production" : {
      user : "skeetzo",
      host : "76.91.217.22",
      ref  : "origin/master",
      repo : "git@github.com:skeetzo/deeznuts-hades.git",
      path : "/home/skeetzo/Sites/alexdeeznuts",
      "post-deploy" : "npm install && pm2 startOrRestart ecosystem.config.js --env production",
      env  : {
        NODE_ENV: "production"
      }
    }
  }
};