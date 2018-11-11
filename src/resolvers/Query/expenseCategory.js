const { getUserId } = require('../../utils');

const expenseCategory = {
  expenseCategories(parent, args, ctx, info) {
    const id = getUserId(ctx);
    return ctx.db.query.expenseCategories(
      { where: { OR: [{ owner: { id } }, { public: true }] } },
      info
    );
  }
};

module.exports = expenseCategory;
