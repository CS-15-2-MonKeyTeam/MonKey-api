const _ = require('lodash');
const { getUserId } = require('../../utils');

const financeOperation = {
  async financeOperations(parent, args, ctx, info) {
    const userId = getUserId(ctx);
    const financeOperations = await ctx.db.query.financeOperations(
      {
        where: { createdBy: { id: userId } }
      },
      `{
        id
        amount
        date
        comment
        account {
          id
          name
          balance
        }
        expense {
          payee
          category {
            id
            name
            public
          }
        }
        income {
          place
          category {
            id
            name
            public
          }
        }
        transfer {
          toAccount {
            id
            name
            balance
          }
        }
      }`
    );

    return financeOperations.map(fo => ({
      ..._.omit(fo, ['expense', 'income', 'transfer']),
      ...fo.expense,
      ...fo.income,
      ...fo.transfer
    }));
  }
};

module.exports = financeOperation;
