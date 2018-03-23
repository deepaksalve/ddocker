const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const favicon = require('serve-favicon');
const child_process = require('child_process');
const mkdirp = require('mkdirp');
const yaml = require('write-yaml');
const ejs = require('ejs');
const fs = require('fs');
const _ = require('lodash')

const app = express();

app.use(favicon(`${__dirname}/public/favicon.ico`));
app.use(bodyParser.json({ limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));
app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');

const data = require('./config');
const dockerfiles = `${__dirname}/dockerfiles`;
const destDockerfileDir = `${__dirname}/users`;
const TYPES = {
  os: 'os',
  database: 'db',
  webServer: 'webserver'
};

const createUserDockerConfig = (user, config, cb) => {
  try {
    const _config = require(`${dockerfiles}/docker-compose.js`);

    _config.services = config;

    mkdirp(`${destDockerfileDir}/${user}`, (err) => {
      if (err) return cb(err);

      return yaml(`${destDockerfileDir}/${user}/docker-compose.yml`, _config, cb);
    });
  } catch (err) {
    return cb(err);
  }
}

const runDockerService = (dest) => {
  return child_process.exec(`docker-compose -f ${destDockerfileDir}/${dest}/docker-compose.yml build`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
};

app.get('/*', (req, res) => res.render('index', { data }));

app.post('/setup', (req, res) => {
  const { os, database, webServer, username } = req.body;
  const userConfig = {
    os: {
      build: `../../dockerfiles/${os}`
    },
    db: {
      build: `../../dockerfiles/${database}`
    },
    webserver: {
      build: `../../dockerfiles/${webServer}`
    },
    'node-server': {
      build: '../../dockerfiles/node-server',
      ports: ['8123:8123']
    }
  };

  return createUserDockerConfig(username, userConfig, (err) => {
    if (err) {
      return res.send('Something went wrong....');
    }

    runDockerService(username);

    return res.render('index', { message: userConfig });
  })
});

app.listen(3000, (err) => {
  if (err) throw err;
  console.log('Server is running on ', 3000);
});
