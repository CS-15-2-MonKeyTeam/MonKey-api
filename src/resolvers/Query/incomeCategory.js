const { getUserId } = require('../../utils');

const incomeCategory = {
  incomeCategories(parent, args, ctx, info) {
    const id = getUserId(ctx);
    return ctx.db.query.incomeCategories({ where: { owner: { id } } }, info);
  }
};

module.exports = incomeCategory;
