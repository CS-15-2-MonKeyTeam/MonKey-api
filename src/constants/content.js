const defaultExpenseCategories = [
  { name: 'Продукты', mandatory: true },
  { name: 'Кафе и рестораны', mandatory: false },
  { name: 'Отдых и развлечения', mandatory: false },
  { name: 'Коммунальные платежи', mandatory: true },
  { name: 'Общественный транспорт', mandatory: true },
  { name: 'Такси', mandatory: false },
  { name: 'Здоровье и красота', mandatory: false },
  { name: 'Хозяйственные товары', mandatory: true },
  { name: 'Одежда и обувь', mandatory: false },
  { name: 'Товары для дома', mandatory: false },
  { name: 'Техника', mandatory: false },
  { name: 'Мебель', mandatory: false }
];
const defaultIncomeCategories = [
  { name: 'Зарплата', mandatory: true },
  { name: 'Премия', mandatory: false }
];
const defaultAccounts = [{ name: 'Наличные' }, { name: 'Кредитная карта' }];

module.exports = { defaultIncomeCategories, defaultExpenseCategories, defaultAccounts };
