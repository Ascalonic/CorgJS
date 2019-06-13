const express = require('express')
const app = express()
const port = 3000
const webpack = require('webpack')
const fs = require('fs')

//Create public directory for serving the files
if(!fs.existsSync('public'))
    fs.mkdirSync('public');

webpack({
    mode: "development"
}, (err, stats) => {
    if (err) {
        console.error(err.stack || err);
        if (err.details) {
            console.error("\x1b[31m", err.details);
        }
        return;
    }

    const info = stats.toJson();

    if (stats.hasErrors()) {
        info.errors.forEach((value, index, array) => {
            console.error("\x1b[31m", value);
        })
    }

    if (stats.hasWarnings()) {
        info.warnings.forEach((value, index, array) => {
            console.warn("\x1b[33m", value);
        })
    }

    console.log("\x1b[37m", '');
    
    //Copy files from webpack dist to public
    fs.copyFileSync('dist/main.js', 'public/main.js');
    fs.copyFileSync('src/index.html', 'public/index.html');

});

app.use(express.static('public'));
app.get('/', (req, res) => res.sendFile('index.html', { root: 'public' }))
app.listen(port, () => console.log(`Corg App listening on port ${port}`))