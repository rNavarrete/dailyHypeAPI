var feed = require('./feeds');

desc('Update articles and releases.');
task('update', [], function (params) {
  feed.releases();
  feed.articles();
   complete();
});

jake.addListener('complete', function () {
  process.exit();
});