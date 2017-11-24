var fs = require('fs');
var path = require('path');
var articlesFile = 'cache/articles.json';
var releasesFile = 'cache/releases.json';
var jsdom = require("jsdom");
const express = require('express');
const router = express.Router();
const pg = require('pg');
var parse = require('pg-connection-string').parse;
var config = parse(process.env.DATABASE_URL || 'postgres://localhost:5432/template1')
//const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/template1';


module.exports.articles = function () {
    scrapeSneakerNews();
}

module.exports.releases = function () {
    scrapeReleaseDates();
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
                console.log("This should be a title Sneakernews: ", cleanedTitle)
            });
            // extract article images
            $(".post-data > p > a > img").each(function () {
                articleSource1['image'].push(encodeURI($(this).attr("src")));
                console.log("This should be a image URL: ", encodeURI($(this).attr("src")))
            });
            // extract article author
            $(".date-and-name > p > span > a").each(function () {
                articleSource1['author'].push($(this).text())
                console.log("This should be a author: ", $(this).text())
            });
            // extract article date
            $(".date-and-name > p > span").each(function () {
                articleSource1['date'].push($(this).first().text().replace(/(?=BY).*/, ""));
                console.log("This should be a date: ", $(this).first().text().replace(/(?=BY).*/, ""))
            });
            // extract article URL
            $(".post-header > h2 > a").each(function () {
                articleSource1['url'].push($(this).attr("href"));
                console.log("This should be a URL: ", $(this).attr("href"))
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
        // url: "https://sneakerfreaker.com/",
        url: "https://hypebeast.com/footwear",
        scripts: ["http://code.jquery.com/jquery.js"],
        done: function (err, window) {
            var $ = window.$;
            // extract article titles
            // $("#main > div > ul > li > div > h2 > a").each(function () {
            $(".title-wrapper > a > h2 > span").each(function () {
                console.log("This should be article titles: ", articleSource2['title'])
                articleSource2['title'].push( $(this).text());
            });
            // extract article images
            // $("li > div > a > img").each(function () {
                $(".col-hb-post-image.teaser > a > img").each(function () {
                    //    articleSource2['image'].push(encodeURI($(this).attr("src")));
                    articleSource2['image'].push($(this).attr("src"));
                    console.log("This should be article images: ", $(this).attr("src"))
                });
                // // extract article URL
                // $("#main > div > ul > li > div > h2 > ").each(function () {
                    $(".col-hb-post-meta.meta > div.title-wrapper > a").each(function () {
                        articleSource2['url'].push($(this).attr("href"));
                        console.log("This should be article URL: ", $(this).attr("href"))
            });
            var orderdArticles = {};
            setArticlesToCorrectOrder(articleSource1, articleSource2);
            window.setTimeout(function () {
                console.log("Exiting now.")
                process.exit()
            }, 20000);
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
    console.log(orderedArticles)
    // insert the articles into the database:
    var pool = new pg.Pool(config)
    pool.connect(function(err, client, done) {
        // Handle connection errors
        if (err) {
            done();
            console.log(err);
            return err;
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
            window.setTimeout(function () {
                console.log("Exiting now.")
                process.exit()
            }, 10000);
        }
    });
}

function updateReleasesTable(releaseData) {
    var pool = new pg.Pool(config)
    pool.connect(function(err, client, done) {
        // Handle connection errors
        if (err) {
            done();
            console.log(err);
            // return res.status(500).json({ success: false, data: err });
            return err
        }
        client.query("DELETE FROM releases;", function (err, result) {
            if (err) throw err;
        });

        // SQL Query > Insert Data
        for (var i = 0; i < releaseData['model'].length; i++) {
            client.query('INSERT INTO releases(model, image, price, releasedate ) values($1, $2, $3, $4) ON CONFLICT DO NOTHING;', [releaseData["model"][i], releaseData["image"][i], releaseData["price"][i], releaseData["releaseDate"][i]], function (err, result) {
                if (err) throw err;
            });
        }
     });
}