const R = require('ramda');
const moment = require('moment');
const { getUserId } = require('../../utils');
const { makeSelectionList, formatPrimitiveFields } = require('../interfaces');

const makeSelection = info =>
  R.compose(
    fields => `{ ${R.join(' ')(fields)} }`,
    makeSelectionList
  )(info);

const financeOperation = {
  financeOperations(
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
      console.log('DATE', date);
      const suka = [
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
      ];
      console.log('SUKA', suka);
      where.AND.push(...suka);
    }

    return ctx.db.query
      .financeOperations(
        {
          where,
          orderBy: 'date_DESC',
          skip,
          after,
          before,
          first,
          last
        },
        makeSelection(info)
      )
      .then(R.map(formatPrimitiveFields));
  }
};

module.exports = financeOperation;
