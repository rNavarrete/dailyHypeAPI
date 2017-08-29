 var feed = require('./feeds');

// desc('Update articles and releases.');
// task('update', [], function (params) {
//   //feed.releases();
//   feed.articles();
// });

// jake.addListener('complete', function () {
//   process.exit();
// });

function updateSneakerFeed() {
  //feed.articles();
  feed.releases();
}

updateSneakerFeed();
