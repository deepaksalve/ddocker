const express = require('express');

const app = express();

app.get('*', (req, res) => {
  res.send('Hello from container.');
});

const server = app.listen(8123, () => {
  const host = server.address().address
  const port = server.address().port

  console.log("App listening at http://%s:%s", host, port);
})
