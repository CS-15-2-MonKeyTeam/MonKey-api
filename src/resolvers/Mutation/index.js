const auth = require('./auth');
const profile = require('./profile');
const financeOperation = require('./financeOperation');
const income = require('./income');
const expense = require('./expense');
const transfer = require('./transfer');

const generateCUD = require('./abstract/generateCUD');

const Mutation = {
  ...auth,
  ...profile,
  ...generateCUD('Account'),
  ...financeOperation,
  ...income,
  ...expense,
  ...transfer,
  ...generateCUD('IncomeCategory'),
  ...generateCUD('ExpenseCategory')
};

module.exports = Mutation;
