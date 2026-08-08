const normalize = require('./normalize');
const dedupe = require('./dedupe');
const sections = require('./sections');
const hnRank = require('./hnRank');
const editorial = require('./editorial');

module.exports = {
  ...normalize,
  ...dedupe,
  ...sections,
  ...hnRank,
  ...editorial,
};
