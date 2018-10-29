const { getUserId } = require('../../utils');

const financeOperation = {
  async deleteFinanceOperation(parent, { id }, ctx, info) {
    const userId = getUserId(ctx);
    const accountExists = await ctx.db.exists.FinanceOperation({ id, createdBy: { id: userId } });
    if (!accountExists) {
      throw new Error("Finance operation not found or you're not the owner.");
    }

    return ctx.db.mutation.deleteFinanceOperation({ where: { id } });
  }
};

module.exports = financeOperation;
