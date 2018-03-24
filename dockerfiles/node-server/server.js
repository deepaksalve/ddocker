const express = require('express');
const ejs = require('ejs');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');

app.get('*', (req, res) => {
  res.render('index');
});

const server = app.listen(8124, () => {
  const host = server.address().address
  const port = server.address().port

  console.log("App listening at http://%s:%s", host, port);
})
