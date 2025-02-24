import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import { CryptoService } from '../cryptoService';

// Простой мок для WebSocket
class MockWebSocket {
  onmessage: ((event: any) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((error: any) => void) | null = null;
  readyState: number = WebSocket.OPEN;

  constructor() {
    // Имитируем получение сообщения после создания
    setTimeout(() => {
      if (this.onmessage) {//если есть входящие сообщения
        this.onmessage({ data: JSON.stringify({ type: 'FEE_UPDATE', fee: '1.5' }) });//отправляем сообщение
      }
    }, 0);
  }

  send() {}//отправка сообщения
  close() {
    this.readyState = WebSocket.CLOSED;//закрытие соединения
    if (this.onclose) {
      this.onclose();//если есть закрытие соединения
    }
  }
}

describe('CryptoService', () => {//тест на класс CryptoService

  it('класс CryptoService должен существовать', () => {//тест на существование класса
    expect(CryptoService).toBeDefined();//тест на существование класса
  });


  it('должен создавать экземпляр через getInstance', () => {//тест на создание экземпляра
    const instance = CryptoService.getInstance();//создание экземпляра
    expect(instance).toBeDefined();//тест на создание экземпляра
  });

  it('getInstance всегда возвращает один и тот же экземпляр', () => {//тест на синглтон
    const instance1 = CryptoService.getInstance();//создание экземпляра
    const instance2 = CryptoService.getInstance();//создание экземпляра
    expect(instance1).toBe(instance2);
  });


  it('экземпляр должен иметь основные методы', () => {//тест на наличие основных методов
    const instance = CryptoService.getInstance();//создание экземпляра
    expect(typeof instance.getSymbols).toBe('function');//тест на наличие метода getSymbols
    expect(typeof instance.getPrice).toBe('function');//тест на наличие метода getPrice
    expect(typeof instance.getFee).toBe('function');//тест на наличие метода getFee
    expect(typeof instance.hasError).toBe('function');//тест на наличие метода hasError
  });
});

describe('CryptoService WebSocket', () => {//тест на WebSocket
  beforeAll(() => {
    vi.useFakeTimers(); // Добавляем мок для таймеров
    vi.stubGlobal('WebSocket', MockWebSocket);//замена глобального WebSocket на мок
  });

  beforeEach(() => {
    const service = CryptoService.getInstance();//создание экземпляра
    service.disconnect();//отключение от WebSocket
    vi.clearAllTimers(); // Очищаем таймеры перед каждым тестом
    vi.clearAllMocks();//очистка моков
  });

  afterAll(() => {
    vi.useRealTimers(); // Возвращаем реальные таймеры
    vi.unstubAllGlobals();//возвращение глобальных переменных
  });

  it('должен подключаться к WebSocket', async () => {//тест на подключение к WebSocket
    const service = CryptoService.getInstance();//создание экземпляра
    const mockCallback = vi.fn();//создание мока
    
    await service.connectWebSocket(mockCallback);//подключение к WebSocket
    expect(service.hasError()).toBe(false);//проверка на ошибку
  });

  it('должен получать обновления комиссии', async () => {//тест на получение обновлений комиссии
    const service = CryptoService.getInstance();//создание экземпляра
    const mockCallback = vi.fn();//создание мока
    
    await service.connectWebSocket(mockCallback);//подключение к WebSocket
    
    await vi.runAllTimersAsync();//выполнение всех таймеров
    expect(mockCallback).toHaveBeenCalledWith('1.5');//проверка на вызов мока
  });


  
});

describe('CryptoService API', () => {//тест на API
  const mockSymbols = [
    { symbol: 'BTC_USDT', base: 'BTC', quote: 'USDT' } //мок для символов
  ];

  const mockPrice = { //мок для цены
    symbol: 'BTC_USDT',
    price: '30000',
    timestamp: Date.now()
  };

  const mockFee = { //мок для комиссии
    symbol: 'BTC_USDT',
    fee: '1.5',
    min_amount: '0.001',
    max_amount: '10',
    timestamp: Date.now()
  };

  beforeAll(() => {
  
    global.fetch = vi.fn();//мок для fetch
  });

  beforeEach(() => {
    vi.clearAllMocks();//очистка моков
  });

  it('должен получать список символов', async () => {//тест на получение списка символов
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ //мок для fetch
      ok: true,
      json: () => Promise.resolve(mockSymbols)//мок для символов
    });

    const service = CryptoService.getInstance();
    const symbols = await service.getSymbols();//получение символов

    expect(symbols).toEqual(mockSymbols);//проверка на равенство
    expect(global.fetch).toHaveBeenCalledWith(//проверка на вызов fetch
      expect.stringContaining('/api/symbols') 
    );
  });

  it('должен получать цену', async () => {//тест на получение цены
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({//мок для fetch
      ok: true,
      json: () => Promise.resolve(mockPrice)
    });

    const service = CryptoService.getInstance();
    const price = await service.getPrice('BTC_USDT');//получение цены

    expect(price).toEqual(mockPrice);//проверка на равенство
    expect(global.fetch).toHaveBeenCalledWith(//проверка на вызов fetch
      expect.stringContaining('/api/ticker/price?symbol=BTC_USDT')//проверка на вызов fetch
    );
  });

  it('должен получать комиссию', async () => {//тест на получение комиссии
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({//мок для fetch
      ok: true,
      json: () => Promise.resolve(mockFee)  //мок для комиссии
    });

    const service = CryptoService.getInstance();
    const fee = await service.getFee('BTC_USDT');//получение комиссии

    expect(fee).toEqual(mockFee);//проверка на равенство
    expect(global.fetch).toHaveBeenCalledWith(//проверка на вызов fetch
      expect.stringContaining('/api/fee?symbol=BTC_USDT')//проверка на вызов fetch
    );
  });
}); 