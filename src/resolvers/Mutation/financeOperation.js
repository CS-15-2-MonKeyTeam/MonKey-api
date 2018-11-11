const R = require('ramda');

const { getUserId } = require('../../utils');
const { makeSelectionList, formatPrimitiveFields } = require('../interfaces');

const makeSelection = info =>
  R.compose(
    fields => `{ ${R.join(' ')(fields)} }`,
    makeSelectionList
  )(info);

function resolveType(fo) {
  if (typeof fo.expense_payee === 'string') {
    return 'E';
  } else if (typeof fo.income_place === 'string') {
    return 'I';
  }
  return 'T';
}

const financeOperation = {
  async deleteFinanceOperation(parent, { id }, ctx, info) {
    const userId = getUserId(ctx);
    const fo = await ctx.db.query.financeOperation(
      { where: { id } },
      '{ id amount expense_payee income_place owner { id } account { id balance } transfer_toAccount { id balance } }'
    );
    if (!fo || fo.owner.id !== userId) {
      throw new Error("Finance operation not found or you're not the owner.");
    }

    let updatedBalance = null;
    // eslint-disable-next-line
    switch (resolveType(fo)) {
      case 'E':
        updatedBalance = fo.account.balance + fo.amount;
        break;
      case 'I':
        updatedBalance = fo.account.balance - fo.amount;
        break;
      case 'T':
        updatedBalance = fo.account.balance + fo.amount;
        await ctx.db.mutation.updateAccount({
          where: { id: fo.transfer_toAccount.id },
          data: { balance: fo.transfer_toAccount.balance - fo.amount }
        });
    }

    await ctx.db.mutation.updateAccount({
      where: { id: fo.account.id },
      data: { balance: updatedBalance }
    });

    return ctx.db.mutation
      .deleteFinanceOperation({ where: { id } }, makeSelection(info))
      .then(formatPrimitiveFields);
  }
};

module.exports = financeOperation;
