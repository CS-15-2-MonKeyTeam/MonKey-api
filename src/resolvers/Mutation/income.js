const R = require('ramda');
const { makeSelectionList, formatPrimitiveFields } = require('../interfaces');
const { getUserId } = require('../../utils');

const makeSelection = info =>
  R.compose(
    fields => `{ ${R.join(' ')(fields)} }`,
    fields =>
      R.map(
        field =>
          field.startsWith('category') || field.startsWith('place') ? `income_${field}` : field,
        fields
      ),
    makeSelectionList
  )(info);

const income = {
  async createIncome(
    parent,
    { amount, accountId, date, comment, place = '', categoryId },
    ctx,
    info
  ) {
    const userId = getUserId(ctx);

    if (amount <= 0) throw new Error('Amount should be greater then 0.');

    const [account, categories] = await Promise.all([
      ctx.db.query.account({ where: { id: accountId } }, '{ id balance owner { id } }'),
      categoryId &&
        ctx.db.exists.ExpenseCategories({
          where: {
            AND: [{ id: categoryId }, { OR: [{ public: true }, { createdBy: { id: userId } }] }]
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
      data: { balance: account.balance + amount }
    });

    return ctx.db.mutation
      .createFinanceOperation(
        {
          data: {
            amount,
            date,
            comment,
            account: { connect: { id: accountId } },
            createdBy: { connect: { id: userId } },
            income_place: place,
            income_category: categoryId && { connect: { id: categoryId } }
          }
        },
        makeSelection(info)
      )
      .then(formatPrimitiveFields);
  },

  async updateIncome(
    parent,
    { id, amount, accountId, date, comment, place, categoryId },
    ctx,
    info
  ) {
    const userId = getUserId(ctx);

    if (typeof amount === 'number' && amount <= 0) {
      throw new Error('Amount should be greater then 0.');
    }

    const fo = await ctx.db.query.financeOperation(
      { where: { id } },
      '{ id amount income_place createdBy { id } account { id balance } }'
    );
    if (!fo || fo.createdBy.id !== userId || typeof fo.income_place !== 'string') {
      throw new Error('Income not found.');
    }

    const newAccount =
      accountId &&
      accountId !== fo.account.id &&
      (await ctx.db.query.account({ where: { id: accountId } }, '{ id balance owner { id } }'));

    let oldAccountBalance = fo.account.balance;
    let newAccountBalance = newAccount && newAccount.balance;

    if (newAccount) {
      oldAccountBalance += fo.amount;
      newAccountBalance += amount || fo.amount;
    } else {
      oldAccountBalance += +amount - fo.amount;
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
            income_place: place,
            income_category: categoryId && { connect: { id: categoryId } }
          }
        },
        makeSelection(info)
      )
      .then(formatPrimitiveFields);
  }
};

module.exports = income;
