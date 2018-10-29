const interfaces = {
  FinanceOperation: {
    __resolveType(obj) {
      // resolve the type of the incoming interface data
      if (obj.payee) {
        return 'Expense';
      } else if (obj.place) {
        return 'Income';
      } 
        return 'Transfer';
    }
  }
};

module.exports = interfaces;
