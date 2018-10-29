const profile = require('./profile');
const account = require('./account');
const financeOperation = require('./financeOperation');

const Query = {
  ...profile,
  ...account,
  ...financeOperation
};

module.exports = Query;
