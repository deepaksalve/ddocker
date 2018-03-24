const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const favicon = require('serve-favicon');
const child_process = require('child_process');
const mkdirp = require('mkdirp');
const yaml = require('write-yaml');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const unzip = require('unzip');
const Busboy = require('busboy');

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
const TYPES = ['os', 'username'];

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
  console.log('\n\n *************************** ');
  console.log('\tCreating docker container.');
  console.log(' *************************** \n\n');

  const docFile = `${destDockerfileDir}/${dest}/docker-compose.yml`
  const cmd = `docker-compose -f ${docFile} build && docker-compose -f ${docFile} up`
  return child_process.exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.log('Failed to create docker container.');
      console.error(`exec error: ${error}`);
      return;
    }

    console.log('Created docker container.');
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
};

app.get('/*', (req, res) => res.render('index', { data }));

app.post('/setup', (req, res) => {
  const busboy = new Busboy({ headers: req.headers });
  const userConfig = {};
  const base64data = [];

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    let buffer = '';

    file.setEncoding('base64');
    file.on('data', buf => (buffer += buf)).on('end', () => base64data.push(buffer));
  });

  busboy.on('field', (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
    if (TYPES.indexOf(fieldname) >= 0) {
      userConfig[fieldname] = val;
    }
  });

  busboy.on('finish', () => {
    console.log('Done parsing form!');
    const { username, os } = userConfig;
    mkdirp(`${destDockerfileDir}/${username}`, (err) => {
      if (err) return cb(err);

      const sourceZip = path.join(destDockerfileDir, username, 'sourcecode.zip');

      fs.writeFile(sourceZip, base64data, 'base64', (err) => {
        if (err) {
          res.writeHead(500, { Connection: 'close', Location: '/' });
          res.end(err);
        } else {
          fs.createReadStream(sourceZip).pipe(unzip.Extract({ path: path.join(destDockerfileDir, username) }));

          const _userConfig = {
            os: {
              build: `../../dockerfiles/${os}`
            },
            'node-server': {
              build: path.join(destDockerfileDir, username, 'node-server'),
              ports: ['8123:8123']
            }
          };
          return createUserDockerConfig(username, _userConfig, (err) => {
            if (err) {
              return res.send('Something went wrong....');
            }

            res.render('index', { message: 'We will soon send you an email along with your container.' });
            runDockerService(username);
          });
        }
      });
    });
  });

  req.pipe(busboy);
});

app.listen(3000, (err) => {
  if (err) throw err;
  console.log('Server is running on ', 3000);
});
