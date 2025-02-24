export const TEST_DATA = { //тестовые данные для проверки обмена криптовалют
  BTC: {
    symbol: 'BTC_USDT', //символ пары
    base: 'BTC', //базовая валюта
    quote: 'USDT', //котируемая валюта
    price: '30000', //цена
    fee: '1.5', //комиссия
    limits: { min: '0.001', max: '10.0' } //лимиты
  },
  ETH: {
    symbol: 'ETH_USDT',
    base: 'ETH',
    quote: 'USDT',
    price: '2000',
    fee: '2.0',
    limits: { min: '0.01', max: '5.0' }
  }
} as const; 