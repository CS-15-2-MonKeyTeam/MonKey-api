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

    const queryPromiseList = [
      ctx.db.query.financeOperation(
        { where: { id } },
        '{ id amount createdBy { id } account { id balance } toAccount { id } }'
      )
    ];

    queryPromiseList.push(
      accountId
        ? ctx.db.query.account({ where: { id: accountId } }, '{ id balance owner { id } }')
        : new Promise(resolve => resolve(undefined))
    );
    if (toAccountId) {
      queryPromiseList.push(
        ctx.db.query.account({ where: { id: toAccountId } }, '{ id balance owner { id } }')
      );
    }

    const [fo, newAccount, newToAccount] = await Promise.all(queryPromiseList);

    if (!fo || fo.createdBy.id !== userId || !fo.toAccount) {
      throw new Error('Transfer not found.');
    }

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

    if (accountId) {
      oldAccountBalance += fo.amount;
      newAccountBalance -= fo.amount;
    } else {
      oldAccountBalance += fo.amount - +amount;
    }
    if (toAccountId) {
      oldToAccountBalance -= fo.amount;
      newToAccountBalance += fo.amount;
    } else {
      oldToAccountBalance -= fo.amount - +amount;
    }

    const promiseList = [];

    if (oldAccountBalance !== fo.account.balance) {
      promiseList.push(
        ctx.db.mutation.updateAccount({
          where: { id: fo.account.id },
          data: {
            balance: oldAccountBalance
          }
        })
      );
    }
    if (newAccount && newAccount.balance !== newAccountBalance) {
      promiseList.push(
        ctx.db.mutation.updateAccount({
          where: { id: newAccount.id },
          data: {
            balance: newAccountBalance
          }
        })
      );
    }
    if (oldToAccountBalance !== fo.toAccount.balance) {
      promiseList.push(
        ctx.db.mutation.updateAccount({
          where: { id: fo.toAccount.id },
          data: {
            balance: oldToAccountBalance
          }
        })
      );
    }
    if (newToAccount && newToAccount.balance !== newToAccountBalance) {
      promiseList.push(
        ctx.db.mutation.updateAccount({
          where: { id: newToAccount.id },
          data: {
            balance: newToAccountBalance
          }
        })
      );
    }

    await Promise.all(promiseList);

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
