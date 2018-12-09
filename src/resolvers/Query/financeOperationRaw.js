const moment = require('moment');
const { getUserId } = require('../../utils');

const financeOperationsRaw = {
  financeOperationsRaw(
    parent,
    { type, categoryId, date, skip, after, before, first, last },
    ctx,
    info
  ) {
    const userId = getUserId(ctx);

    const where = { AND: [{ owner: { id: userId } }] };

    if (type) {
      switch (type) {
        case 'EXPENSE':
          where.AND.push({ expense_payee_not: null });
          break;
        case 'INCOME':
          where.AND.push({ income_place_not: null });
          break;
        case 'TRANSFER':
          where.AND.push({ transfer_toAccount: { id_not: null } });
          break;

        default:
          break;
      }
    }

    if (categoryId) {
      if (!type) {
        throw new Error(
          'You should specify a "type" argument if you want to filter financeOperations by categoryId.'
        );
      }
      where.AND.push({ [`${type.toLowerCase()}_category`]: { id_not: null } });
    }

    if (date) {
      where.AND.push(
        {
          date_gte: moment(date)
            .startOf('day')
            .toISOString()
        },
        {
          date_lte: moment(date)
            .endOf('day')
            .toISOString()
        }
      );
    }

    return ctx.db.query.financeOperationRaws(
      {
        where,
        orderBy: 'date_DESC',
        skip,
        after,
        before,
        first,
        last
      },
      info
    );
  }
};

module.exports = financeOperationsRaw;
