const express = require('express');

const app = express();

app.get('*', (req, res) => {
  res.send('Hello from container.');
});

app.listen(8123, () => {
  console.log('Server started.....');
});
