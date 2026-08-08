const normalize = require('./normalize');
const dedupe = require('./dedupe');
const sections = require('./sections');

module.exports = {
  ...normalize,
  ...dedupe,
  ...sections,
};
