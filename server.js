var express = require('express');
var pg = require('pg');
var parse = require('pg-connection-string').parse;
var config = parse(process.env.DATABASE_URL || 'postgres://localhost:5432/template1')
const path = require('path');
var fs = require('fs');
var feed = require('./feeds');
var articlesFile = 'cache/articles.json';
var releasesFile = 'cache/releases.json';

if (process.env.DATABASE_URL){
  pg.defaults.ssl = true;
}
console.log("This is the config.", config);

var app = express();
app.use(express.bodyParser());

app.get('/releases', function (req, res) {
    const results = [];
  // Get a Postgres client from the connection pool
  var pool = new pg.Pool(config)
  pool.connect(function (err, client, done) {
    // Handle connection errors
    if (err) {
      done();
      console.log(err);
      return res.status(500).json({ success: false, data: err });
    }
    // SQL Query > Select Data
    // const query = client.query('SELECT * FROM releases ORDER BY id ASC;');
    // Stream results back one row at a time
    client.query('SELECT * FROM releases ORDER BY id ASC;', (err, res) => {
      res.rows.forEach(row => {
        results.push(row);
      });
      // query.on('row', (row) => {
      // results.push(row);
      // });
      // After all data is returned, close connection and return results
      // query.on('end', () => {
      // done();
      client.end();
      return res.json(results);

    });
  });
  });

app.post('/article', (req, res, next) => {
  const results = [];
  // Grab data from http request
  console.log(req.body)
  const data = {title: req.body.title, author: req.body.author, image: req.body.image,url: req.body.url, source: req.body.source};
  // Get a Postgres client from the connection pool
  var pool = new pg.Pool(config)
  pool.connect(function (err, client, done) {
    // Handle connection errors
    if (err) {
      done();
      console.log(err);
      return res.status(500).json({ success: false, data: err });
    }
    const query = {
      text: 'INSERT INTO articles(title, author, image, url, source ) values($1, $2, $3, $4, $5)',
      values: [[data.title, data.author, data.image, data.url, data.source]],
    }
    // SQL Query > Insert Data
    // client.query('INSERT INTO articles(title, author, image, url, source ) values($1, $2, $3, $4, $5)',
    // [data.title, data.author, data.image, data.url, data.source]);

    client.query(query, (err, res) => {
      res.rows.forEach(row => {
        results.push(row);
      });
      // SQL Query > Select Data
      const query = client.query('SELECT * FROM items ORDER BY id ASC');
      // Stream results back one row at a time
      client.query('INSERT INTO articles(title, author, image, url, source ) values($1, $2, $3, $4, $5)', (err, r) => {
        r.rows.forEach(row => {
          results.push(row);
        });
      })
      // After all data is returned, close connection and return results
      // query.on('end', () => {
      // done();
      client.end();
      return res.json(results);
      // });
    });
  });
});

app.post('/search', (req, res, next) => {
  const results = [];
  // Grab data from http request
  console.log(req.body)
  const data = {query: req.body.query};
  // Get a Postgres client from the connection pool
  var pool = new pg.Pool(config)
  pool.connect(function(err, client, done) {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    const query = {
      text: "SELECT * FROM articles WHERE title ILIKE $1 ORDER BY id DESC;",
      values:  ['%' + data.query+ '%'],
    }
    // SQL Query > Insert Data
    // const query = client.query("SELECT * FROM articles WHERE title ILIKE $1 ORDER BY id DESC;", ['%' + data.query+ '%']);
    // Stream results back one row at a time
    client.query(query, (err, res) => {
    res.rows.forEach(row=>{
      results.push(row);
    });

    // query.on('row', (row) => {
      // results.push(row);
      // });
      // After all data is returned, close connection and return results
      client.end();
      return res.json(results);
    });
  });
  });

  app.get('/articles', (req, res, next) => {
    const results = [];
    // Get a Postgres client from the connection pool
    var pool = new pg.Pool(config)
    pool.connect(function(err, client, done) {
      // Handle connection errors
      if(err) {
        done();
        console.log(err);
        return res.status(500).json({success: false, data: err});
      }

      // SQL Query > Select Data
      // const query = client.query('SELECT * FROM articles ORDER BY id DESC;');
      client.query('SELECT * FROM articles ORDER BY id DESC LIMIT 50;', (err, res) => {
      // Stream results back one row at a time
        res.rows.forEach(row => {
          results.push(row);
        });
      // After all data is returned, close connection and return results
      console.log("Are there any results here1: ", results)
      client.end();
      console.log("Are there any results here2: ", results)
    });
    console.log("Are there any results here3: ", results)
  });
  console.log("Are there any results here4: ", results)
  return res.json(results);
  });


  app.post('/view', (req, res, next) => {
    // Grab data from http request
    console.log(req.body)
    const data = {id: req.body.id, view: req.body.views};
    // Get a Postgres client from the connection pool
    var pool = new pg.Pool(config)
    pool.connect(function(err, client, done) {
      // Handle connection errors
      if(err) {
        done();
        console.log(err);
        return res.status(500).json({success: false, data: err});
      }
      const query = {
        text: 'UPDATE articles SET viewcount = viewcount + 1 WHERE id = ($1) AND viewcount = ($2)',
        values:  [data.id, data.view],
      }
      // SQL Query > Insert Data
      // const query = client.query('UPDATE articles SET viewcount = viewcount + 1 WHERE id = ($1) AND viewcount = ($2)',
      client.query(query, (err, res) => {
        res.rows.forEach(row=>{
          results.push(row);
        });
      client.end();
      return res.status(200).json({ success: true });
      });
    });
});

app.listen(process.env.PORT || 5000)