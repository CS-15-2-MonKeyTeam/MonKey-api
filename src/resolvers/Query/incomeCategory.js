const { getUserId } = require('../../utils');

const incomeCategory = {
  incomeCategories(parent, args, ctx, info) {
    const id = getUserId(ctx);
    return ctx.db.query.incomeCategories(
      { where: { OR: [{ owner: { id } }, { public: true }] } },
      info
    );
  }
};

module.exports = incomeCategory;
