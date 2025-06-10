
const CURRENCIES = [
  { code: 'NPR', symbol: 'रु', name: 'Nepalese Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

export const getCurrencySymbol = (): string => {
  try {
    const savedCurrency = localStorage.getItem('user-currency') || 'NPR';
    const currency = CURRENCIES.find(c => c.code === savedCurrency);
    return currency?.symbol || 'रु';
  } catch (error) {
    console.warn('Error accessing localStorage for currency:', error);
    return 'रु';
  }
};

export const formatCurrency = (amount: number): string => {
  const symbol = getCurrencySymbol();
  return `${symbol} ${amount.toLocaleString()}`;
};

export { CURRENCIES };
