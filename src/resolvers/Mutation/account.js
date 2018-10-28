const { getUserId } = require('../../utils');

const account = {
  createAccount(parent, { name, balance }, ctx, info) {
    const id = getUserId(ctx);
    return ctx.db.mutation.createAccount({ data: { name, balance, owner: { connect: { id } } } });
  },

  async deleteAccount(parent, { id }, ctx, info) {
    const userId = getUserId(ctx);
    const accountExists = await ctx.db.exists.Account({ id, owner: { id: userId } });
    if (!accountExists) {
      throw new Error("Account not found or you're not the owner.");
    }

    return ctx.db.mutation.deleteAccount({ where: { id } });
  },

  async updateAccount(parent, { id, name }, ctx, info) {
    const userId = getUserId(ctx);
    const accountExists = await ctx.db.exists.Account({ id, owner: { id: userId } });
    if (!accountExists) {
      throw new Error("Account not found or you're not the owner.");
    }

    return ctx.db.mutation.updateAccount({ where: { id }, data: { name } });
  }
};

module.exports = account;
