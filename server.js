var express = require('express');
var fs = require('fs');
var feed = require('./feeds');
var articlesFile = 'cache/articles.json';


var app = express()

app.get('/articles', function (req, res) {
    feed.articles();
    results = JSON.parse(fs.readFileSync(articlesFile));
    res.json(results)
})

app.listen(process.env.PORT || 5000)