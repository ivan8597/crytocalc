import { http, HttpResponse } from 'msw'; 
import { API_BASE_URL } from '../config'; 

export const handlers = [ //массив обработчиков
  http.get(`${API_BASE_URL}/api/symbols`, () => { //запрос на получение символов
    return HttpResponse.json([ 
      {
        symbol: "BTC_USDT", //символ
        base: "BTC", //базовая валюта
        quote: "USDT", //котируемая валюта
        formula_type: "default" //тип формулы
      }
    ]);
  }),

  http.get(`${API_BASE_URL}/api/ticker/price`, () => { //запрос на получение цены
    return HttpResponse.json({ 
      symbol: "BTC_USDT", //символ
      price: "30000.00", //цена
      timestamp: Date.now() //время
    });
  }),

  http.get(`${API_BASE_URL}/api/fee`, () => { //запрос на получение комиссии
    return HttpResponse.json({ //ответ на запрос
      fee: "1.50", //комиссия
      min_amount: "0.001", //минимальная сумма
      max_amount: "10.0", //максимальная сумма
      timestamp: Date.now() //время
    });
  })
]; 