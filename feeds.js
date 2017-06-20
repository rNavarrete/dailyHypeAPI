var fs = require('fs');
var path = require('path');
var articlesFile = 'cache/articles.json';
var releasesFile = 'cache/releases.json';
var csv = require('csv');
var jsdom = require("jsdom");
const express = require('express');
const router = express.Router();
const pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/template1';

module.exports.articles = function () {
    scrapeSneakerNews();
}

module.exports.releases = function () {
    scrapeReleaseDates();
    console.log("Updated releases.")
}

function scrapeSneakerNews() {
    var articleSource1 = {
    'title': [],
    'author': [],
    'image': [],
    'date': [],
    'url': [],
    };
    jsdom.env({
        url: "https://sneakernews.com/",
        scripts: ["http://code.jquery.com/jquery.js"],
        done: function (err, window) {
            var $ = window.$;
            // extract article titles
            $(".header-title").each(function () {
                var cleanedTitle = ""
                cleanedTitle = $(this).text().trim();
                articleSource1['title'].push(cleanedTitle);
            });
            // extract article images
            $(".post-data > p > a > img").each(function () {
                articleSource1['image'].push(encodeURI($(this).attr("src")));
            });
            // extract article author
            $(".date-and-name > p > span > a").each(function () {
                articleSource1['author'].push($(this).text())
            });
            // extract article date
            $(".date-and-name > p > span").each(function () {
                articleSource1['date'].push($(this).first().text().replace(/(?=BY).*/, ""));
            });
            // extract article URL
            $(".post-header > h2 > a").each(function () {
                articleSource1['url'].push($(this).attr("href"));
            });
        }
    })

    var articleSource2 = {
    'title': [],
    'author': [],
    'image': [],
    'date': [],
    'url': [],
    };

    jsdom.env({
        url: "https://sneakerfreaker.com/",
        scripts: ["http://code.jquery.com/jquery.js"],
        done: function (err, window) {
            var $ = window.$;
            // extract article titles
            $("#main > div > ul > li > div > h2 > a").each(function () {
                articleSource2['title'].push( $(this).text());
            });
            // extract article images
            $("li > div > a > img").each(function () {
               articleSource2['image'].push(encodeURI($(this).attr("src")));
            });
            // // extract article URL
            $("#main > div > ul > li > div > h2 > ").each(function () {
                articleSource2['url'].push($(this).attr("href"));
            });
            var orderdArticles = {};
            setArticlesToCorrectOrder(articleSource1, articleSource2);
            // window.setTimeout(function () {
            //     console.log("Exiting now.")
            //     process.exit()
            // }, 30000);
        }
    })
}


function setArticlesToCorrectOrder(source1, source2) {
    var orderedArticles = {
        'title': [],
        'author': [],
        'image': [],
        'date': [],
        'url': [],
        'source': []
    };
    source2['title'].map(function (e, i) {
        orderedArticles['title'].push(source1['title'][i]);
        orderedArticles['title'].push(source2['title'][i]);
    });
    orderedArticles['title'] = orderedArticles['title'].filter(Boolean);
    source1['author'].map(function (e, i) {
        orderedArticles['author'].push(source1['author'][i]);
        orderedArticles['author'].push(source2['author'][i]);
    });
    orderedArticles['author'] = orderedArticles['author'].filter(Boolean);
    // zip the image arrays from the sources into one
    source2['image'].map(function (e, i) {
        orderedArticles['image'].push(source1['image'][i]);
        orderedArticles['image'].push(source2['image'][i]);
    });
    orderedArticles['image'] = orderedArticles['image'].filter(Boolean);
    source2['date'].map(function (e, i) {
        orderedArticles['date'].push(source1['date'][i]);
        orderedArticles['date'].push(source2['date'][i]);
    });
    orderedArticles['date'] = orderedArticles['date'].filter(Boolean);
    source2['url'].map(function (e, i) {
        orderedArticles['url'].push(source1['url'][i]);
        orderedArticles['url'].push(source2['url'][i]);
    });
    orderedArticles['url'] = orderedArticles['url'].filter(Boolean);
    // insert the articles into the database:
    pg.connect(connectionString, (err, client, done) => {
        // Handle connection errors
        if (err) {
            done();
            console.log(err);
            return res.status(500).json({ success: false, data: err });
        }
        // SQL Query > Insert Data
        for (var i = 0; i < orderedArticles['title'].length; i++) {
            console.log(orderedArticles['title'])
            client.query('INSERT INTO articles(title, author, image, url, source ) values($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING;', [orderedArticles["title"][i], orderedArticles["author"][i], orderedArticles["image"][i], orderedArticles["url"][i], orderedArticles["source"][i]], function (err, result) {
                if (err) throw err;
            });
        }

    })
}

function scrapeReleaseDates() {
    var releases = {
        'releaseDate': [],
        'model': [],
        'price': [],
        'image': [],
    };

    jsdom.env({
        url: "https://sneakernews.com/release-dates",
        scripts: ["http://code.jquery.com/jquery.js"],
        done: function (err, window) {
            var $ = window.$;
            // extract release date
            $(".release-date").each(function () {
                releases['releaseDate'].push($(this).text());
            });
            // extract article title
            $(".post-header > h2 > a > span").each(function () {
                releases['model'].push($(this).text());
            });
            // extract article price
            $(".post-header > div > p > span").each(function () {
                releases['price'].push($(this).text());
            });
            // extract shoe image
            $(".release-img > a > img").each(function () {
                releases['image'].push($(this).attr("src"));
            });
            updateReleasesTable(releases)
        }
    });
}

function updateReleasesTable(releaseData) {
     pg.connect(connectionString, (err, client, done) => {
        // Handle connection errors
        if (err) {
            done();
            console.log(err);
            return res.status(500).json({ success: false, data: err });
        }
        // SQL Query > Insert Data
        for (var i = 0; i < releaseData['model'].length; i++) {
            client.query('INSERT INTO releases(model, image, price, releasedate ) values($1, $2, $3, $4) ON CONFLICT (model) DO UPDATE SET (releasedate) = ($4);', [releaseData["model"][i], releaseData["image"][i], releaseData["price"][i], releaseData["releaseDate"][i]], function (err, result) {
                if (err) throw err;
            });
            // write to the .json file
            //fs.writeFile(releasesFile, JSON.stringify(releaseDates, null, 2), function (err) {
            //  console.log('JSON saved to ' + releasesFile);
            //});
        }
        process.exit()
     });
}