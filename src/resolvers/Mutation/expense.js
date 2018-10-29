const _ = require('lodash');
const { getUserId } = require('../../utils');

const expense = {
  async createExpense(parent, { amount, accountId, date, comment, payee, categoryId }, ctx, info) {
    const userId = getUserId(ctx);
    const [commonCategoryExists, categoryExists, accountExists] = await Promise.all([
      ctx.db.exists.ExpenseCategory({ id: categoryId, public: true }),
      ctx.db.exists.ExpenseCategory({ id: categoryId, createdBy: { id: userId } }),
      ctx.db.exists.Account({ id: accountId })
    ]);
    if (!commonCategoryExists && !categoryExists) {
      throw new Error('Category not found.');
    }
    if (!accountExists) {
      throw new Error('Account not found.');
    }

    const financeOperation = await ctx.db.mutation.createFinanceOperation(
      {
        data: {
          amount,
          date,
          comment,
          account: { connect: { id: accountId } },
          createdBy: { connect: { id: userId } },
          expense: { create: { payee, category: { connect: { id: categoryId } } } }
        }
      },
      '{ id, amount, date, comment, account { id, name, balance }, expense { payee, category { id, name, public } } }'
    );

    const balance = financeOperation.account.balance - amount;

    const account = await ctx.db.mutation.updateAccount({
      where: { id: accountId },
      data: { balance }
    });

    return { ..._.omit(financeOperation, ['expense']), ...financeOperation.expense, account };
  }

  // async updateExpense(parent, { amount, accountId, date, comment, payee, categoryId }, ctx, info) {
  // TODO:
  // }
};

module.exports = expense;
