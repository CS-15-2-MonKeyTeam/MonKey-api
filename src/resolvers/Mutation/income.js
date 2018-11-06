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
    const promiseList = [
      ctx.db.query.account({ where: { id: accountId } }, '{ id balance owner { id } }')
    ];
    if (categoryId) {
      promiseList.push(
        ctx.db.exists.IncomeCategory({ id: categoryId, public: true }),
        ctx.db.exists.IncomeCategory({ id: categoryId, createdBy: { id: userId } })
      );
    }
    const [account, commonCategoryExists, categoryExists] = await Promise.all(promiseList);

    if (categoryId && !commonCategoryExists && !categoryExists) {
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

    const fo = await ctx.db.query.financeOperation(
      { where: { id } },
      '{ id amount income_place createdBy { id } account { id balance } }'
    );
    if (!fo || fo.createdBy.id !== userId || typeof fo.income_place !== 'string') {
      throw new Error('Income not found.');
    }

    // TODO: if accountId

    if (typeof amount === 'number') {
      await ctx.db.mutation.updateAccount({
        where: { id: fo.account.id },
        data: { balance: fo.account.balance + (amount - fo.amount) }
      });
    }

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
