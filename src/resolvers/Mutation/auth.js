const jwt = require('jsonwebtoken');
const axios = require('axios');

const { ACCOUNT_KIT_API_URL } = require('../../constants');

const auth = {
  async auth(parent, { accountkitAccessToken }, ctx, info) {
    let account;
    try {
      const resp = await axios.get(
        `${ACCOUNT_KIT_API_URL}me/?access_token=${accountkitAccessToken}`
      );
      account = resp.data;
    } catch (err) {
      if (err.response) {
        throw new Error(err.response.data.error.message);
      } else {
        throw new Error('Server error. Problems with Facebook Account Kit API.');
      }
    }

    if (account.application.id !== process.env.ACCOUNT_KIT_APP_ID) {
      throw new Error('Incorrect OAuth access token for MonKey App.');
    }

    const phone = account.phone.number;
    let user = await ctx.db.query.user({ where: { phone } });

    if (!user) {
      user = await ctx.db.mutation.createUser({
        data: { phone }
      });
    }

    return {
      token: jwt.sign({ userId: user.id }, process.env.JWT_SECRET),
      user
    };
  }
};

module.exports = { auth };
