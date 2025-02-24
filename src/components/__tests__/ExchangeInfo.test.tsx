import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'effector-react';
import { fork, allSettled } from 'effector';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from '../../config';
import { ExchangeInfo } from '../CryptoCalculator/ExchangeInfo';
import { loadSymbolsFx, loadPriceAndFeeFx, setSymbol } from '../../models/crypto';

const server = setupServer(
  // Мок для символов
  http.get(`${API_BASE_URL}/api/symbols`, () => { //получение списка доступных пар
    return HttpResponse.json([
      { 
        symbol: 'BTC_USDT', //значение по умолчанию для символа
        base: 'BTC', //значение по умолчанию для базовой валюты
        quote: 'USDT', //значение по умолчанию для котируемой валюты
        formula_type: 'custom', //значение по умолчанию для типа формулы
        formula_id: 'premium_btc' //значение по умолчанию для идентификатора формулы
      }
    ]);
  }),

  // Мок для цены
  http.get(`${API_BASE_URL}/api/ticker/price`, () => { //получение цены
    return HttpResponse.json({
      symbol: 'BTC_USDT', //значение по умолчанию для символа
      price: '30000.00', //значение по умолчанию для цены
      timestamp: Date.now() //значение по умолчанию для времени
    });
  }),

  // Мок для комиссии
  http.get(`${API_BASE_URL}/api/fee`, () => { //получение комиссии
    return HttpResponse.json({
      symbol: 'BTC_USDT', //значение по умолчанию для символа
      fee: '1.5', //значение по умолчанию для комиссии
      min_amount: '0.001', //значение по умолчанию для минимальной суммы
      max_amount: '10.0', //значение по умолчанию для максимальной суммы
      timestamp: Date.now() //значение по умолчанию для времени
    });
  })
);

beforeAll(() => server.listen()); //начало работы сервера
afterEach(() => server.resetHandlers()); //сброс обработчиков
afterAll(() => server.close()); //закрытие сервера

describe('ExchangeInfo', () => {
  it('должен показывать описание формулы для премиум пар', async () => {// тест для проверки на отображение описания формулы для пар с премиум формулой
    const scope = fork();
    
    // Загружаем начальные данные
    await allSettled(loadSymbolsFx, { scope }); //загружаем символы
    await allSettled(setSymbol, { scope, params: 'BTC_USDT' }); //устанавливаем символ
    await allSettled(loadPriceAndFeeFx, { scope, params: 'BTC_USDT' }); //загружаем цену и комиссию для пары BTC_USDT
    
    render(
      <Provider value={scope}>
        <ExchangeInfo />
      </Provider>
    );

    // Проверяем отображение всей информации
    await waitFor(async () => { //ожидаем обновления информации
      expect(await screen.findByTestId('fee-display')).toHaveTextContent('1.5%'); //проверяем отображение комиссии
      expect(await screen.findByTestId('limits-info')).toHaveTextContent('от 0.001 до 10.0 btc'); //проверяем отображение лимитов
      expect(await screen.findByTestId('price-display')).toHaveTextContent('30000.00'); //проверяем отображение цены
      
      const formulaInfo = await screen.findByTestId('formula-info'); //получаем элемент с информацией о формуле
      expect(formulaInfo).toHaveTextContent('Premium'); //проверяем отображение информации о формуле
      expect(formulaInfo).toHaveTextContent('Премиум формула'); //проверяем отображение информации о формуле
    });
  });
}); 