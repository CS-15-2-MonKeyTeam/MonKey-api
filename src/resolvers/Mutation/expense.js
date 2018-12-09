const R = require('ramda');
const { makeSelectionList, formatPrimitiveFields } = require('../interfaces');
const { getUserId } = require('../../utils');

const makeSelection = info =>
  R.compose(
    fields => `{ ${R.join(' ')(fields)} }`,
    fields =>
      R.map(
        field =>
          field.startsWith('category') || field.startsWith('payee') ? `expense_${field}` : field,
        fields
      ),
    makeSelectionList
  )(info);

const expense = {
  async createExpense(
    parent,
    { amount, accountId, date, comment, payee = '', categoryId },
    ctx,
    info
  ) {
    const userId = getUserId(ctx);

    if (amount <= 0) throw new Error('Amount should be greater then 0.');

    const [account, categories] = await Promise.all([
      ctx.db.query.account({ where: { id: accountId } }, '{ id balance owner { id } }'),
      categoryId &&
        ctx.db.query.expenseCategories({
          where: {
            AND: [{ id: categoryId }, { owner: { id: userId } }]
          }
        })
    ]);

    if (categoryId && !categories.length) {
      throw new Error('Category not found.');
    }
    if (!account || account.owner.id !== userId) {
      throw new Error('Account not found.');
    }

    await ctx.db.mutation.updateAccount({
      where: { id: accountId },
      data: { balance: account.balance - amount }
    });

    return ctx.db.mutation
      .createFinanceOperationRaw(
        {
          data: {
            amount,
            date,
            comment,
            account: { connect: { id: accountId } },
            owner: { connect: { id: userId } },
            expense_payee: payee,
            expense_category: categoryId && { connect: { id: categoryId } }
          }
        },
        makeSelection(info)
      )
      .then(formatPrimitiveFields);
  },

  async updateExpense(
    parent,
    { id, amount, accountId, date, comment, payee, categoryId },
    ctx,
    info
  ) {
    const userId = getUserId(ctx);

    if (typeof amount === 'number' && amount <= 0) {
      throw new Error('Amount should be greater then 0.');
    }

    const fo = await ctx.db.query.financeOperationRaw(
      { where: { id } },
      '{ id amount expense_payee owner { id } account { id balance } }'
    );
    if (!fo || fo.owner.id !== userId || typeof fo.expense_payee !== 'string') {
      throw new Error('Expense not found.');
    }

    const newAccount =
      accountId &&
      accountId !== fo.account.id &&
      (await ctx.db.query.account({ where: { id: accountId } }, '{ id balance owner { id } }'));

    let oldAccountBalance = fo.account.balance;
    let newAccountBalance = newAccount && newAccount.balance;

    if (newAccount) {
      oldAccountBalance += fo.amount;
      newAccountBalance -= amount || fo.amount;
    } else {
      oldAccountBalance += fo.amount - +amount;
    }

    await Promise.all([
      oldAccountBalance !== fo.account.balance &&
        ctx.db.mutation.updateAccount({
          where: { id: fo.account.id },
          data: {
            balance: oldAccountBalance
          }
        }),
      newAccount &&
        newAccount.balance !== newAccountBalance &&
        ctx.db.mutation.updateAccount({
          where: { id: newAccount.id },
          data: {
            balance: newAccountBalance
          }
        })
    ]);

    return ctx.db.mutation
      .updateFinanceOperation(
        {
          where: { id },
          data: {
            amount,
            date,
            comment,
            account: accountId && { connect: { id: accountId } },
            expense_payee: payee,
            expense_category: categoryId && { connect: { id: categoryId } }
          }
        },
        makeSelection(info)
      )
      .then(formatPrimitiveFields);
  }
};

module.exports = expense;
