const profile = require('./profile');
const account = require('./account');
const financeOperation = require('./financeOperation');
const incomeCategory = require('./incomeCategory');
const expenseCategory = require('./expenseCategory');
const financeOperationsRaw = require('./financeOperationRaw');

const Query = {
  ...profile,
  ...account,
  ...financeOperation,
  ...incomeCategory,
  ...expenseCategory,
  ...financeOperationsRaw
};

module.exports = Query;
