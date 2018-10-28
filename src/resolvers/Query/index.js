const profile = require('./profile');
const account = require('./account');

const Query = {
  ...profile,
  ...account
};

module.exports = Query;
