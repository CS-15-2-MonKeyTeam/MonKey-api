const auth = require('./auth');
const profile = require('./profile');
const account = require('./account');
const financeOperation = require('./financeOperation');
const income = require('./income');
const expense = require('./expense');
const transfer = require('./transfer');

const Mutation = {
  ...auth,
  ...profile,
  ...account,
  ...financeOperation,
  ...income,
  ...expense,
  ...transfer
};

module.exports = Mutation;
