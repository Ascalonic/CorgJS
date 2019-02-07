const express = require('express')
const builder = require('./corg/builder')
const app = express()
const port = 3000

builder.initStatic();
builder.createStatic('src/App');
builder.finalizeStatic();

app.use(express.static('public'));
app.get('/', (req, res) => res.sendFile('index.html', {root: 'public'}))
app.listen(port, ()=> console.log(`Corg App listening on port ${port}`))