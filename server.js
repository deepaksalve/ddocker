const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const favicon = require('serve-favicon');
const child_process = require('child_process');
const mkdirp = require('mkdirp');
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

const setupDocker = (type, dock, dest, cb) => {
  fs.readFile(`${dockerfiles}/${dock}/Dockerfile`, (err, config, buffer) => {
    if (err) return cb(err);

    mkdirp(`${destDockerfileDir}/${dest}/${type}`, (err) => {
      if (err) return cb(err);

      fs.writeFile(`${destDockerfileDir}/${dest}/${type}/Dockerfile`, config, err => cb(err));
    });
  });
};

const setupDockerComposer = (dest, cb) => {
  fs.readFile(`${dockerfiles}/docker-compose.yml`, (err, config, buffer) => {
    if (err) return cb(err);

    mkdirp(`${destDockerfileDir}/${dest}`, (err) => {
      if (err) return cb(err);

      fs.writeFile(`${destDockerfileDir}/${dest}/docker-compose.yml`, config, err => cb(err));
    });
  });
};

app.get('/*', (req, res) => res.render('index', { data }));

app.post('/setup', (req, res) => {
  const { os, database, webServer, username } = req.body;

  return setupDocker(TYPES.os, os, username, (err) => {
    if (err) return res.send(err);

    return setupDocker(TYPES.database, database, username, (err) => {
      if (err) return res.send(err);

      return setupDocker(TYPES.webServer, webServer, username, (err) => {
        if (err) return res.send(err);

        return setupDockerComposer(username, (err) => {
          if (err) return res.send(err);

          return res.render('index', { message: 'Soon.....' });
        });
      });
    });
  });

  // child_process.exec('cat ./dockerfiles/MySQL/dockerfile.sample', (error, stdout, stderr) => {
  // 	if (error) {
  // 		console.error(`exec error: ${error}`);
  // 		return;
  // 	}
  // 	console.log(`stdout: ${stdout}`);
  // 	console.log(`stderr: ${stderr}`);
  // 	res.render('index', { message: 'Soon...' });
  // });
});

app.listen(3000, (err) => {
  if (err) throw err;
  console.log('Server is running on ', 3000);
});
