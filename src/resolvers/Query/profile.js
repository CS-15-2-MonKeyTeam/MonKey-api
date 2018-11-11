const { getUserId } = require('../../utils');

const profile = {
  async me(parent, args, ctx, info) {
    const id = getUserId(ctx);
    const userInfo = await ctx.db.query.user({ where: { id } }, info);

    if (userInfo.incomeCategories) {
      const publicCategories = await ctx.db.query.incomeCategories({ where: { public: true } });
      userInfo.incomeCategories = userInfo.incomeCategories.concat(publicCategories);
    }
    if (userInfo.expenseCategories) {
      const publicCategories = await ctx.db.query.expenseCategories({ where: { public: true } });
      userInfo.expenseCategories = userInfo.expenseCategories.concat(publicCategories);
    }

    return userInfo;
  }
};

module.exports = profile;
