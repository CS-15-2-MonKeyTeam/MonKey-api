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
    const promiseList = [ctx.db.query.account({ where: { id: accountId } }, '{ id balance }')];
    if (categoryId) {
      promiseList.push(
        ctx.db.exists.ExpenseCategory({ id: categoryId, public: true }),
        ctx.db.exists.ExpenseCategory({ id: categoryId, createdBy: { id: userId } })
      );
    }
    const [account, commonCategoryExists, categoryExists] = await Promise.all(promiseList);

    if (categoryId && !commonCategoryExists && !categoryExists) {
      throw new Error('Category not found.');
    }
    if (!account) {
      throw new Error('Account not found.');
    }

    await ctx.db.mutation.updateAccount({
      where: { id: accountId },
      data: { balance: account.balance - amount }
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
            expense_payee: payee,
            expense_category: categoryId && { connect: { id: categoryId } }
          }
        },
        makeSelection(info)
      )
      .then(formatPrimitiveFields);
  }

  // async updateExpense(parent, { amount, accountId, date, comment, payee, categoryId }, ctx, info) {
  //   const userId = getUserId(ctx);
  //   const foExists = await ctx.db.exists.FinanceOperation({ id, createdBy: { id: userId } });
  //   if (!foExists) {
  //     throw new Error("Finance operation not found or you're not the owner.");
  //   }

  //   return ctx.db.mutation
  //     .deleteFinanceOperation({ where: { id } }, makeSelection(info))
  //     .then(formatPrimitiveFields);
  // }
};

module.exports = expense;
