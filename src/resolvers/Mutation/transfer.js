const R = require('ramda');
const { makeSelectionList, formatPrimitiveFields } = require('../interfaces');
const { getUserId } = require('../../utils');

const makeSelection = info =>
  R.compose(
    fields => `{ ${R.join(' ')(fields)} }`,
    fields => R.map(field => (field.startsWith('toAccount') ? `transfer_${field}` : field), fields),
    makeSelectionList
  )(info);

const transfer = {
  async createTransfer(parent, { amount, accountId, date, comment, toAccountId }, ctx, info) {
    const userId = getUserId(ctx);

    if (amount <= 0) throw new Error('Amount should be greater then 0.');

    const [account, toAccount] = await Promise.all([
      ctx.db.query.account({ where: { id: accountId } }, '{ id balance owner { id } }'),
      ctx.db.query.account({ where: { id: toAccountId } }, '{ id balance owner { id } }')
    ]);

    if (!account || !toAccount || account.owner.id !== userId || toAccount.owner.id !== userId) {
      throw new Error('Account not found.');
    }

    await Promise.all([
      ctx.db.mutation.updateAccount({
        where: { id: accountId },
        data: { balance: account.balance - amount }
      }),
      ctx.db.mutation.updateAccount({
        where: { id: toAccountId },
        data: { balance: account.balance + amount }
      })
    ]);

    return ctx.db.mutation
      .createFinanceOperation(
        {
          data: {
            amount,
            date,
            comment,
            account: { connect: { id: accountId } },
            createdBy: { connect: { id: userId } },
            transfer_toAccount: { connect: { id: toAccountId } }
          }
        },
        makeSelection(info)
      )
      .then(formatPrimitiveFields);
  },

  async updateTransfer(parent, { id, amount, accountId, date, comment, toAccountId }, ctx, info) {
    const userId = getUserId(ctx);

    if (typeof amount === 'number' && amount <= 0) {
      throw new Error('Amount should be greater then 0.');
    }

    const fo = await ctx.db.query.financeOperation(
      { where: { id } },
      '{ id amount createdBy { id } account { id balance } toAccount { id } }'
    );

    if (!fo || fo.createdBy.id !== userId || !fo.toAccount) {
      throw new Error('Transfer not found.');
    }

    const [newAccount, newToAccount] = await Promise.all(
      accountId &&
        fo.account.id !== accountId &&
        ctx.db.query.account({ where: { id: accountId } }, '{ id balance owner { id } }'),
      toAccountId &&
        fo.toAccoun.id !== toAccountId &&
        ctx.db.query.account({ where: { id: toAccountId } }, '{ id balance owner { id } }')
    );

    if (
      (accountId && (!newAccount || newAccount.owner.id !== userId)) ||
      (toAccountId && (!newToAccount || newToAccount.owner.id !== userId))
    ) {
      throw new Error('Account not found.');
    }

    let oldAccountBalance = fo.account.balance;
    let newAccountBalance = newAccount && newAccount.balance;
    let oldToAccountBalance = fo.toAccount.balance;
    let newToAccountBalance = newToAccount && newToAccount.balance;

    if (newAccount) {
      oldAccountBalance += fo.amount;
      newAccountBalance -= fo.amount;
    } else {
      oldAccountBalance += fo.amount - +amount;
    }
    if (newToAccount) {
      oldToAccountBalance -= fo.amount;
      newToAccountBalance += fo.amount;
    } else {
      oldToAccountBalance -= fo.amount - +amount;
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
        }),
      oldToAccountBalance !== fo.toAccount.balance &&
        ctx.db.mutation.updateAccount({
          where: { id: fo.toAccount.id },
          data: {
            balance: oldToAccountBalance
          }
        }),
      newToAccount &&
        newToAccount.balance !== newToAccountBalance &&
        ctx.db.mutation.updateAccount({
          where: { id: newToAccount.id },
          data: {
            balance: newToAccountBalance
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
            transfer_toAccount: toAccountId && { connect: { id: toAccountId } }
          }
        },
        makeSelection(info)
      )
      .then(formatPrimitiveFields);
  }
};

module.exports = transfer;
