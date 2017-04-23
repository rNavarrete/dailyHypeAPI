"use strict";
var fs = require('fs');
var path = require('path');
var articlesFile = 'cache/articles.json';
var csv = require('csv');
var jsdom = require("jsdom");

module.exports.articles = function () {
    scrapeSneakerNews();
}

function scrapeSneakerNews() {
    var article = {
    'title': [],
    'author': [],
    'image': [],
    'date': [],
    };
    jsdom.env({
        url: "https://sneakernews.com/",
        scripts: ["http://code.jquery.com/jquery.js"],
        done: function (err, window) {
            var $ = window.$;
            // extract article titles
            $(".header-title").each(function () {
                article['title'].push( $(this).text());
            });
            // extract article images
            $(".post-data > p > a > img").each(function () {
                article['image'].push( $(this).attr("src"));
            });
            // extract article author
            $(".date-and-name > p > span > a").each(function () {
                article['author'].push($(this).text());
            });
            // extract article date
            $(".date-and-name > p > span").each(function () {
                article['date'].push($(this).first().text().replace(/(?=BY).*/, ""));
            });
            // write to the .json file
            fs.writeFile(articlesFile, JSON.stringify(article, null, 2), function(err) {
                console.log('JSON saved to ' + articlesFile);
            });
        }
    })
}