var express = require('express');
var pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/template1';
const path = require('path');
var fs = require('fs');
var feed = require('./feeds');
var articlesFile = 'cache/articles.json';
var releasesFile = 'cache/releases.json';
if (process.env.DATABASE_URL){
  pg.defaults.ssl = true;
}

var app = express();
app.use(express.bodyParser());

// app.get('/articles', function (req, res) {
//     feed.articles();
//     results = JSON.parse(fs.readFileSync(articlesFile));
//     res.json(results)
// })

app.get('/releases', function (req, res) {
    feed.releases();
    results = JSON.parse(fs.readFileSync(releasesFile));
    res.json(results)
})

app.post('/article', (req, res, next) => {
  const results = [];
  // Grab data from http request
  console.log(req.body)
  const data = {title: req.body.title, author: req.body.author, image: req.body.image,url: req.body.url, source: req.body.source};
  // Get a Postgres client from the connection pool
  pg.connect(connectionString, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Insert Data
    client.query('INSERT INTO articles(title, author, image, url, source ) values($1, $2, $3, $4, $5)',
    [data.title, data.author, data.image, data.url, data.source]);
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM items ORDER BY id ASC');
    // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

app.get('/articles', (req, res, next) => {
  const results = [];
  // Get a Postgres client from the connection pool
  pg.connect(connectionString, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM articles ORDER BY id DESC;');
    // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});


app.post('/view', (req, res, next) => {
  // Grab data from http request
  console.log(req.body)
  const data = {id: req.body.id, view: req.body.views};
  // Get a Postgres client from the connection pool
  pg.connect(connectionString, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Insert Data
  const query = client.query('UPDATE articles SET viewcount = viewcount + 1 WHERE id = ($1) AND viewcount = ($2)',
    [data.id, data.view]);
    query.on('row', (row) => {
      results.push(row);
    });
    query.on('end', () => {
      done();
      return res.status(200).json({ success: true });
    });
  });
});



var CronJob = require('cron').CronJob;

var job = new CronJob('* 10 * * * *', function () {
  console.log('You will see this message every second');
  feed.articles();
}, null, true, 'America/Los_Angeles');
job.start();

app.listen(process.env.PORT || 5000)