 var feed = require('./feeds');

function updateSneakerFeed() {
  feed.articles();
  feed.releases();
}

updateSneakerFeed();
