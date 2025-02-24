import { describe, it, expect, afterEach, afterAll, beforeAll, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CryptoCalculator } from '../CryptoCalculator/index';
import { Provider } from 'effector-react';
import { fork, allSettled } from 'effector';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from '../../config';
import { loadSymbolsFx, loadPriceAndFeeFx, $limits, $selectedSymbol } from '../../models/crypto';

// Мок для WebSocket
class MockWebSocket {
  onmessage: ((event: any) => void) | null = null;//тип на входящие сообщения
  onclose: (() => void) | null = null;//тип на закрытие соединения
  onerror: ((error: any) => void) | null = null;//тип на ошибки
  readyState = WebSocket.OPEN;//тип на состояние соединения
  
  private eventListeners: Record<string, Function[]> = {//тип на события
    message: [],//тип на входящие сообщения
    close: [],//тип на закрытие соединения
    error: [],//тип на ошибки
    open: []//тип на открытие соединения
  };

  constructor() {
    setTimeout(() => {//задержка на отправку сообщения
      if (this.onmessage) {//если есть входящие сообщения
        this.onmessage({ data: JSON.stringify({ type: 'FEE_UPDATE', fee: '1.5' }) });//отправляем сообщение
      }
      this.eventListeners.message.forEach(listener => {//для каждого слушателя
        listener({ data: JSON.stringify({ type: 'FEE_UPDATE', fee: '1.5' }) });//отправляем сообщение
      });
    }, 0);
  }

  addEventListener(event: string, callback: Function) {//добавление слушателя
    if (!this.eventListeners[event]) {//если нет слушателя
      this.eventListeners[event] = [];//создаем слушателя
    }
    this.eventListeners[event].push(callback);//добавляем слушателя
  }

  removeEventListener(event: string, callback: Function) {//удаление слушателя
    if (this.eventListeners[event]) {//если есть слушатель
      this.eventListeners[event] = this.eventListeners[event].filter(//фильтруем слушателя
        listener => listener !== callback//фильтруем слушателя
      );
    }
  }

  send() {}//отправка сообщения
  close() {//закрытие соединения
    if (this.onclose) this.onclose();//если есть закрытие соединения
    this.eventListeners.close.forEach(listener => listener());//для каждого слушателя
  }
}

const server = setupServer(//настройка сервера
  http.get(`${API_BASE_URL}/api/symbols`, () => {//запрос на получение символов
    return HttpResponse.json([
      { symbol: 'BTC_USDT', base: 'BTC', quote: 'USDT', formula_type: 'custom', formula_id: 'btc_usdt' }//ответ на запрос
    ]);
  }),

  http.get(`${API_BASE_URL}/api/ticker/price`, () => {
    return HttpResponse.json({ symbol: 'BTC_USDT', price: '30000', timestamp: Date.now() });
  }),

  http.get(`${API_BASE_URL}/api/fee`, () => {//запрос на получение комиссии
    return HttpResponse.json({
      symbol: 'BTC_USDT',
      fee: '1.5',
      min_amount: '0.001',
      max_amount: '10',
      timestamp: Date.now()
    });
  }),

  http.post(`${API_BASE_URL}/api/exchange`, () => {//запрос на обмен
    return HttpResponse.json({ success: true });
  })
);

// Настройка тестового окружения
beforeAll(() => {
  // Мокаем глобальный WebSocket
  vi.stubGlobal('WebSocket', MockWebSocket);
  server.listen({ onUnhandledRequest: 'bypass' }); // добавляем опцию для игнорирования необработанных запросов
});

afterEach(() => {//после каждого теста
  server.resetHandlers();//сброс обработчиков
  vi.clearAllMocks();//очистка моков
});

afterAll(() => {//после всех тестов
  vi.unstubAllGlobals();//отмена всех глобальных моков
  server.close();//закрытие сервера
});

describe('CryptoCalculator', () => {//тест на отображение базовой структуры
  it('должен отображать базовую структуру', () => {//тест на отображение базовой структуры
    render(<CryptoCalculator />);
    
    expect(screen.getByTestId('crypto-calculator')).toBeInTheDocument();//проверка на отображение базовой структуры
    expect(screen.getByTestId('exchange-form')).toBeInTheDocument();//проверка на отображение базовой структуры
    expect(screen.getByRole('heading', { name: /Калькулятор обмена криптовалют/i })).toBeInTheDocument();//проверка на отображение базовой структуры
  });

  it('должен загружать и отображать пару BTC/USDT', async () => {//тест на отображение пары BTC/USDT
    render(<CryptoCalculator />);
    
    await waitFor(() => {
      const select = screen.getByTestId('symbol-select');
      console.log('Select element:', select); // Отладочное сообщение
      expect(select).toBeInTheDocument();
      const option = screen.getByRole('option', { name: 'BTC/USDT' });
      console.log('Option element:', option); // Отладочное сообщение
      expect(option).toBeInTheDocument();
    });

    // Дополнительная проверка, если необходимо
    const options = screen.getAllByRole('option');
    console.log('All options:', options); // Отладочное сообщение
    expect(options.length).toBeGreaterThan(0); // Убедитесь, что есть хотя бы одна опция
  });

  it('должен позволять ввод суммы', async () => {//тест на ввод суммы
    render(<CryptoCalculator />);
    
    const input = screen.getByTestId('amount-input');//получение элемента ввода суммы
    fireEvent.change(input, { target: { value: '1' } });//изменение значения элемента ввода суммы
    
    expect(input).toHaveValue(1);
  });

  it('должен иметь кнопку обмена', () => {//тест на наличие кнопки обмена
    render(<CryptoCalculator />);
    
    const button = screen.getByTestId('submit-button');//получение элемента кнопки обмена
    expect(button).toBeInTheDocument();//проверка на наличие элемента кнопки обмена
    expect(button).toHaveTextContent('Обменять');//проверка на наличие текста кнопки обмена
  });

  it('должен отображать подсказку для ввода', async () => {//тест на отображение подсказки для ввода
    const scope = fork({
      values: [
        [$limits, { min: '0.001', max: '10.0' }], //значение по умолчанию для лимитов
        [$selectedSymbol, 'BTC_USDT'] //значение по умолчанию для символа
      ]
    });

    // Загружаем необходимые данные
    await allSettled(loadSymbolsFx, { scope }); //загрузка символов
    await allSettled(loadPriceAndFeeFx, { scope, params: 'BTC_USDT' }); //загрузка цены и комиссии

    render(
      <Provider value={scope}>
        <CryptoCalculator />
      </Provider>
    );

    // Ждем загрузки и выбираем пару
    await act(async () => {
      const select = screen.getByTestId('symbol-select'); //получение элемента выбора символа
      fireEvent.change(select, { target: { value: 'BTC_USDT' } }); //изменение значения элемента выбора символа
    });

    // Проверяем подсказку
    const hint = screen.getByTestId('input-limits'); //получение элемента подсказки
    expect(hint).toBeInTheDocument(); //проверка на отображение элемента подсказки
    expect(hint).toHaveTextContent('Мин: 0.001 BTC'); //проверка на отображение элемента подсказки
    expect(hint).toHaveTextContent('Макс: 10 BTC'); //проверка на отображение элемента подсказки
  });


 
  
});

describe('CryptoCalculator Integration Tests', () => { //интеграционный тест для проверки обмена криптовалют
  it('должен завершить успешный процесс обмена', async () => { //асинхронная проверка на успешный обмен
    const scope = fork(); 
    
    // Инициализируем начальные данные
    await allSettled(loadSymbolsFx, { scope }); // Загружаем символы
    await allSettled(loadPriceAndFeeFx, { scope, params: 'BTC_USDT' }); // Загружаем цену и комиссию для пары BTC_USDT

    render(
      <Provider value={scope}>
        <CryptoCalculator /> 
      </Provider>
    );

    // Ждем загрузки формы
    const symbolSelect = await screen.findByTestId('symbol-select'); // Получаем элемент выбора символа
    const amountInput = await screen.findByTestId('amount-input'); // Получаем элемент ввода суммы
    const submitButton = await screen.findByTestId('submit-button'); // Получаем кнопку отправки

    // Заполняем форму
    fireEvent.change(symbolSelect, { target: { value: 'BTC_USDT' } }); // Устанавливаем значение выбора символа
    fireEvent.change(amountInput, { target: { value: '1' } }); // Устанавливаем значение ввода суммы
    
    // Отправляем форму
    fireEvent.click(submitButton); // Кликаем по кнопке отправки

    // Проверяем модальное окно подтверждения
    const confirmModal = await screen.findByTestId('confirm-modal'); // Получаем модальное окно подтверждения
    expect(confirmModal).toBeInTheDocument(); // Проверяем, что модальное окно присутствует
    expect(confirmModal).toHaveTextContent('Подтверждение обмена'); // Проверяем текст в модальном окне
    expect(confirmModal).toHaveTextContent('1 BTC'); // Проверяем текст в модальном окне
    expect(confirmModal).toHaveTextContent('BTC/USDT'); // Проверяем текст в модальном окне

    // Подтверждаем обмен
    const confirmButton = await screen.findByText('Подтвердить'); // Получаем кнопку подтверждения
    fireEvent.click(confirmButton); // Кликаем по кнопке подтверждения

    // Проверяем окно успешного результата
    const successMessage = await screen.findByText('Обмен успешно выполнен'); // Получаем сообщение об успешном обмене
    expect(successMessage).toBeInTheDocument(); // Проверяем, что сообщение присутствует

    // Закрываем окно результата
    const closeButton = await screen.findByText('Закрыть'); // Получаем кнопку закрытия
    fireEvent.click(closeButton); // Кликаем по кнопке закрытия

    // Ждем очистки формы
    await waitFor(() => {
      expect(amountInput).toHaveValue(null); // Проверяем, что поле ввода суммы очищено
      expect(symbolSelect).toHaveValue(''); // Проверяем, что выбор символа очищен
    });
  });
});


