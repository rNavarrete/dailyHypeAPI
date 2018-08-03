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

var articleSource2 = {
    'title': [],
    'author': [],
    'image': [],
    'date': [],
    'url': [],
};

var articleSource1 = {
    'title': [],
    'author': [],
    'image': [],
    'date': [],
    'url': [],
};


function scrapeSneakerNews() {

    var year = new Date().getFullYear();
    jsdom.env({
        url: "https://sneakernews.com/2018",
        scripts: ["http://code.jquery.com/jquery.js"],
        done: function (err, window) {
            var $ = window.$;
            // extract article titles
            $(".post-content > h4 > a").each(function () {
                var cleanedTitle = ""
                cleanedTitle = $(this).text().trim();
                articleSource1['title'].push(cleanedTitle);
                // console.log("This should be a title Sneakernews: ", cleanedTitle)
            });
            // extract article images
            $(".image-box > a > img").each(function () {
                articleSource1['image'].push(encodeURI($(this).attr("src")));
                // console.log("This should be a image URL: ", encodeURI($(this).attr("src")))
            });
            // extract article author
            $(".posted-by > a").each(function () {
                articleSource1['author'].push($(this).text())
                // console.log("This should be a author: ", $(this).text())
            });
            // extract article date
            $(".date-and-name > p > span").each(function () {
                articleSource1['date'].push($(this).first().text().replace(/(?=BY).*/, ""));
                // console.log("This should be a date: ", $(this).first().text().replace(/(?=BY).*/, ""))
            });
                // // extract article URL
            $(".post-content > h4 > a").each(function () {
                articleSource1['url'].push($(this).attr("href"));
                console.log("This should be the sneakernews title URL: ", $(this).attr("href"))
            });
            // setArticlesToCorrectOrder(articleSource1, articleSource2);
            // var orderdArticles = {};
            // window.setTimeout(function () {
            //     console.log("Exiting now.")
            //     process.exit()
            // }, 20000);
        }
    })


    jsdom.env({
        url: "https://hypebeast.com/footwear",
        scripts: ["http://code.jquery.com/jquery.js"],
        done: function (err, window) {
            var $ = window.$;
            // extract article titles
            $(".title").each(function () {
                articleSource2['title'].push( $(this).text());
                // console.log("This should be article titles hypebeast: ", $(this).text())
            });
            // extract article images
            $(".post-box-image-container.fixed-ratio-3-2 > a > img").each(function () {
                articleSource2['image'].push($(this).attr("data-src"));
                // console.log("This should be article images hypebeast: ", $(this).attr("data-src"));
            });
                // // extract article URL
            $(".title").each(function () {
                articleSource2['url'].push($(this).attr("href"));
                console.log("This should be article URL hypebeast: ", $(this).attr("href"))
            });
            var orderdArticles = {};
            setArticlesToCorrectOrder(articleSource2, articleSource1);
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
    //console.log("source1: ", source1)
    //console.log("source2: ", source2)
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
    console.log("That's my bro: "+ orderedArticles)
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
            // console.log(orderedArticles['title'])
            const query  = 'INSERT INTO articles(title, author, image, url, source ) values($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING;'
            // console.log(query)
            const values =  [orderedArticles["title"][i], orderedArticles["author"][i], orderedArticles["image"][i], orderedArticles["url"][i], orderedArticles["source"][i]]
            client.query(query, values, (err, result) => {
                // client.query('INSERT INTO articles(title, author, image, url, source ) values($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING;', [orderedArticles["title"][i], orderedArticles["author"][i], orderedArticles["image"][i], orderedArticles["url"][i], orderedArticles["source"][i]], function (err, result) {
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
                $(".releases-box").each(function () {
                    // grab the release date of the article
                    var releaseDate = $(this).find("div.release-date-and-rating > span").text().trim().replace(/[^\d.-]/g, '').replace(/0/g, '').substring(0, 4)
                    // console.log("This is the release date: ", releaseDate)
                    // grab the current date
                    var date = new Date();
                    date = (date.getMonth() + 1) + "." + date.getDate();
                    console.log("This is the current date: ", date)
                    console.log("This is the releaseDate date: ", releaseDate)
                    if (parseFloat(releaseDate) >= parseFloat(date) ) {
                     console.log("From within the conditional: ", $(this).text().trim().replace(/[^\d.-]/g, '').substring(0, 5))
                    releases['releaseDate'].push($(this).text().trim().replace(/[^\d.-]/g, '').substring(0, 5));
                    console.log("Release date being added to releases data structure: ", $(this).find(" h2 > a").text())

                    //$(".content-box > h2 > a").each(function () {
                        releases['model'].push($(this).find("h2 > a").text());
                        console.log("Shoe model: ", $(this).find(" h2 > a").text())
                    //});
                    // extract article price
                    //$(".release-price").each(function () {
                        releases['price'].push($(this).find(".release-price").text());
                        console.log("Shoe price: ", $(this).find(".release-price").text())
                    //});
                    // extract shoe image
                    //$(".image-box > a > img").each(function () {
                        releases['image'].push($(this).find(".image-box > a > img").attr("src"));
                        console.log("shoe image link: ", $(this).find(".image-box > a > img").attr("src"))
                    //});
                }
             });
                // extract article title
            console.log("These are the releases before we send to update table: ", releases)
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
        console.log("This is the release data: ",releaseData)
        // SQL Query > Insert Data
        for (var i = 0; i < releaseData['model'].length; i++) {
            const query = {
                text: 'INSERT INTO releases(model, image, price, releasedate ) values($1, $2, $3, $4) ON CONFLICT DO NOTHING;',
                values: [releaseData["model"][i], releaseData["image"][i], releaseData["price"][i], releaseData["releaseDate"][i]],
              }
            client.query(query, (err, res) => {
                if (err) throw err;
            });
        }
     });
}