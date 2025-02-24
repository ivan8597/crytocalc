import { API_BASE_URL, WS_BASE_URL } from '../config';
import type { ExchangeFormData } from '../types';
import { setWsError } from '../models/crypto'; //импорт функции для установки ошибки в WebSocket

export interface Symbol {
  symbol: string;
  base: string;
  quote: string;
  formula_type: 'default' | 'custom';
  formula_id?: string;
}

interface Price {
  symbol: string;
  price: string;
  timestamp: number;
}

interface Fee {
  symbol: string;
  fee: string;
  min_amount: string;
  max_amount: string;
  timestamp: number;
}

// Интерфейс для кастомных формул
interface CustomFormula {
  calculate: (amount: number, price: string, fee: string) => number;//метод для расчета суммы обмена
  description: string;//описание формулы
}


// Словарь кастомных формул
const customFormulas: Record<string, CustomFormula> = {//словарь кастомных формул
  'premium_btc': {
    description: 'Премиум формула с пониженной комиссией (0.5x)',
    calculate: (amount: number, price: string, fee: string) => {//метод для расчета суммы обмена
      const priceValue = parseFloat(price);//конвертируем цену в число
      const feeValue = parseFloat(fee) / 100;//конвертируем комиссию в число
      // Пониженная комиссия для премиум клиентов
      return amount * priceValue * (1 - feeValue * 0.5);//расчет суммы обмена
    }
  },

  'high_volume': {//формула для крупных объемов с динамической комиссией
    description: 'Формула для суммы свыше 5 с динамической комиссией',
    calculate: (amount: number, price: string, fee: string) => {//метод для расчета суммы обмена
      const priceValue = parseFloat(price);//конвертируем цену в число
      const feeValue = parseFloat(fee) / 100;//конвертируем комиссию в число
      // Скидка 30% для объемов свыше 5
      const volumeDiscount = amount > 5 ? 0.7 : 1;//расчет скидки
      return amount * priceValue * (1 - feeValue * volumeDiscount);//расчет суммы обмена
    }
  },

  'btc_usdt': { // Добавля формулу для BTC/USDT
    description: 'Формула для BTC/USDT с динамической комиссией',
    calculate: (amount: number, price: string, fee: string) => {
      const priceValue = parseFloat(price);
      const feeValue = parseFloat(fee) / 100;
      const volumeDiscount = amount > 5 ? 0.7 : 1;
      return amount * priceValue * (1 - feeValue * volumeDiscount);
    }
  }
};

// Кастомные типы ошибок
export class ApiError extends Error {//кастомный тип ошибок
  constructor(
    message: string,//сообщение об ошибке
    public status?: number,//статус ошибки
    public code?: string//код ошибки
  ) {
    super(message);//вызов родительского сообщения об ошибке
    this.name = 'ApiError';//название ошибки 
  }
}



export class CryptoService {
  // Статические свойства и методы в начале класса
  private static instance: CryptoService | null = null;

  public static getInstance(): CryptoService {
    if (!CryptoService.instance) {
      CryptoService.instance = new CryptoService();
    }
    return CryptoService.instance;
  }

  // Приватный конструктор
  private constructor() {
    this.symbols = [];
    this.feeCache = new Map();
    this.feeUpdateCallbacks = [];
    this.currentSymbol = '';
    this.isConnecting = false;
    this.hasConnectionError = false;
  }

  // Приватные свойства
  private readonly API_BASE_URL = API_BASE_URL;//базовый url для запросов
  private readonly CACHE_TTL = 10 * 60 * 1000;//время кэширования комиссии
  private symbols: Symbol[] = [];//массив символов
  private feeCache: Map<string, { fee: Fee; timestamp: number }> = new Map();//кэш комиссии
  private ws: WebSocket | null = null;//соединение с WebSocket
  private feeUpdateCallbacks: ((fee: string) => void)[] = [];//колбэки для обновления комиссии
  private pollingInterval: NodeJS.Timeout | null = null;//таймер для обновления цен
  private currentSymbol: string = '';
  private isConnecting = false;//флаг подключения
  private hasConnectionError = false;//флаг наличия ошибки

  // Подключение к WebSocket
  connectWebSocket(callback: (fee: string) => void) {
    try {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {//если соединение не открыто
        this.ws = new WebSocket(WS_BASE_URL);//создание нового соединения
        
        this.ws.onopen = () => {//событие открытия соединения
          console.log('WebSocket connected');//вывод в консоль
          this.hasConnectionError = false;//сброс флага наличия ошибки
          setWsError(false);//сброс ошибки
        };

        this.ws.onmessage = (event) => {//событие получения сообщения
          try {
            const data = JSON.parse(event.data);//парсинг данных
            if (data.type === 'FEE_UPDATE') {//если тип сообщения - обновление комиссии
              callback(data.fee);//вызов колбэка
            }
          } catch (error) {
            console.error('Error processing message:', error);//вывод ошибки
            this.hasConnectionError = true;//установка флага наличия ошибки
            setWsError(true);//установка ошибки
            callback('error');//вызов колбэка
          }
        };

        this.ws.onerror = (error) => {//событие ошибки
          console.error('WebSocket error:', error);//вывод ошибки
          this.hasConnectionError = true;//установка флага наличия ошибки
          setWsError(true);//установка ошибки
          callback('error');//вызов колбэка
        };

        this.ws.onclose = () => {//событие закрытия соединения
          console.log('WebSocket closed');//вывод в консоль
          // Только если это не было вызвано ошибкой
          if (!this.hasConnectionError) {//если нет ошибки
            this.hasConnectionError = true;//установка флага наличия ошибки
            setWsError(true);//установка ошибки
            callback('error');//вызов колбэка
          }
        };
      }
    } catch (error) {
      console.error('WebSocket connection failed:', error);//вывод ошибки
      this.hasConnectionError = true;//установка флага наличия ошибки
      setWsError(true);//установка ошибки
      callback('error');//вызов колбэка
    }
  }

  // Отключение от обновлений
  disconnect() {//метод для отключения от обновлений
    this.isConnecting = false;//сброс флага подключения
    // Очищаем таймеры
    if (this.pollingInterval) {//если таймер polling существует
      clearInterval(this.pollingInterval);//очистка таймера
      this.pollingInterval = null;//сброс таймера polling
    }

    // Закрываем WebSocket если он открыт
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {//если соединение открыто
      this.ws.close();//закрытие соединения
    }
    this.ws = null;//сброс соединения
    this.feeUpdateCallbacks = [];//сброс колбэков
  }
// Метод для обработки ответов
  private async handleResponse<T>(response: Response): Promise<T> {//метод для обработки ответов
    if (!response.ok) {//если ответ не ok
      if (response.status >= 500) {//если статус ответа больше 500
        throw new ApiError('Ошибка сервера, попробуйте позже', response.status);//вывод ошибки
      }
      if (response.status === 429) {//если статус ответа 429
        throw new ApiError('Слишком много запросов, подождите немного', response.status);//вывод ошибки
      }
      const error = await response.json().catch(() => ({}));//получение ошибки
      throw new ApiError(//вывод ошибки
        error.message || 'Произошла ошибка при запросе',//сообщение об ошибке
        response.status,//статус ошибки
        error.code//код ошибки
      );
    }
    return response.json();//возвращаем ответ
  }
// Метод для получения списка символов
  async getSymbols(): Promise<Symbol[]> {//метод для получения списка символов
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/symbols`);//запрос на получение списка символов
      this.symbols = await this.handleResponse(response);//обработка ответа
      return this.symbols;//возвращаем список символов
    } catch (error) {
      if (error instanceof ApiError) throw error;//если ошибка является экземпляром ApiError, выбрасываем ошибку
      throw new ApiError('Не удалось загрузить список символов');//вывод ошибки
    }
  }

  // Добавить pooling для автообновления цен каждые N секунд
  async getPrice(symbol: string): Promise<Price> {//метод для получения цены
    this.currentSymbol = symbol;//установка текущего символа
    const response = await fetch(`${this.API_BASE_URL}/api/ticker/price?symbol=${symbol}`);//запрос на получение цены
    if (!response.ok) {//если ответ не ok
      throw new Error('Не удалось получить цену');
    }
    return response.json();
  }

  // Комиссию кэшировать на 10 минут, так как комиссии  меняются редко
  async getFee(symbol: string): Promise<Fee> {//метод для получения комиссии
    // Проверяем кэш
    const cached = this.feeCache.get(symbol);//получение комиссии из кэша
    const now = Date.now();//получение текущей даты

    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {//если комиссия существует и не устарела
      return cached.fee;//возвращаем комиссию
    }

    // Если нет в кэше или устарело, делаем запрос
    const response = await fetch(`${this.API_BASE_URL}/api/fee?symbol=${symbol}`);
    if (!response.ok) {
      throw new Error('Не удалось получить информацию о комиссии');
    }

    const fee = await response.json();//получение комиссии
    
    // Сохраняем в кэш
    this.feeCache.set(symbol, {//сохранение комиссии в кэш
      fee,//комиссия
      timestamp: now//время сохранения
    });

    return fee;
  }

  // Метод для обновления кэша при получении WebSocket обновления
  updateFeeCache(symbol: string, newFee: string) {//метод для обновления кэша
    const cached = this.feeCache.get(symbol);//получение комиссии из кэша
    if (cached) {//если комиссия существует
      cached.fee.fee = newFee;//обновление комиссии
      cached.timestamp = Date.now();//время обновления
    }
  }

  // Основная формула расчета:
  // Получаемая сумма = (Введенная сумма × цена) × (1 - комиссия)
  calculateAmount(inputAmount: number, price: string, fee: string, symbol: Symbol): number {//метод для расчета суммы обмена
    if (symbol.formula_type === 'custom' && symbol.formula_id) {//если тип формулы - кастомный и существует id формулы
      const formula = customFormulas[symbol.formula_id];//получение формулы из словаря
      if (formula) {//если формула существует
          return formula.calculate(inputAmount, price, fee);//расчет суммы обмена
        }
    }
    
    // Стандартная формула для default типа
    const priceValue = parseFloat(price);//конвертируем цену в число
    const feeValue = parseFloat(fee) / 100;//конвертируем комиссию в число
    return inputAmount * priceValue * (1 - feeValue);//расчет суммы обмена
  }

  // Метод для получения описания формулы
  getFormulaDescription(symbol: Symbol): string {//метод для получения описания формулы
    if (symbol.formula_type === 'custom' && symbol.formula_id) {//если тип формулы - кастомный и существует id формулы
      const formula = customFormulas[symbol.formula_id];//получение формулы из словаря
      if (formula) {
        return `${formula.description} (${this.getFormulaExample(symbol)})`;//возвращаем описание формулы
      }
    }
    return 'Стандартная формула расчета';
  }

  // Проверка на минимальную и максимальную сумму обмена
  validateAmount(amount: number, minAmount: string, maxAmount: string): boolean {//метод для проверки суммы обмена
    const min = parseFloat(minAmount);//конвертируем минимальную сумму в число
    const max = parseFloat(maxAmount);//конвертируем максимальную сумму в число
    return amount >= min && amount <= max;//возвращаем результат проверки
  }

  // Добавляем метод для тестов
  public emitFeeUpdate(fee: string) {//метод для вызова колбэков
    this.feeUpdateCallbacks.forEach(callback => callback(fee));//вызов колбэков
  }

  // Метод для обмена
  async exchange(data: ExchangeFormData): Promise<{ success: boolean }> {//метод для обмена
    try {
      // Валидация входных данных
      if (!data.symbol || !data.amount) {//если нет символа или суммы
        throw new Error('Необходимо заполнить все поля');//вывод ошибки
      }

      const amount = parseFloat(data.amount);//конвертируем сумму в число
      if (isNaN(amount) || amount <= 0) {//если сумма не является числом или меньше 0
        throw new Error('Сумма должна быть положительным числом');//вывод ошибки
      }

      const response = await fetch(`${API_BASE_URL}/api/exchange`, {//запрос на обмен 
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          symbol: data.symbol,//символ
          amount: amount.toString()//сумма
        })
      });

      // Обработка ответа
      if (!response.ok) {
        if (response.status === 0) {
          throw new Error('NetworkError');
        }
        if (response.status === 400) {
          const error = await response.json();
          throw new Error(error.message || 'Ошибка валидации');
        }
        if (response.status >= 500) {
          throw new Error('Ошибка сервера, попробуйте позже');
        }
        throw new Error('Не удалось выполнить обмен');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Не удалось выполнить обмен');
    }
  }

  // Метод для получения информации о символе
  getSymbolInfo(symbol: string): Symbol | null {//метод для получения информации о символе
    const foundSymbol = this.symbols.find(s => s.symbol === symbol);//поиск символа в массиве
    console.log('Found Symbol:', foundSymbol);//вывод символа
    return foundSymbol || null;//возвращаем символ или null
  }
  // Метод для получения примера формулы
  getFormulaExample(symbol: Symbol): string {//метод для получения примера формулы
    if (symbol.formula_type === 'custom' && symbol.formula_id) {//если тип формулы - кастомный и существует id формулы
      switch (symbol.formula_id) {//выбор формулы
        case 'premium_btc':
          return 'Сумма × Курс × (1 - Комиссия × 0.5)';
        case 'high_volume':
          return 'Сумма × Курс × (1 - Комиссия × Скидка)';
        case 'btc_usdt':
          return 'Сумма × Курс × (1 - Комиссия × Скидка)';
        default:
          return 'Сумма × Курс × (1 - Комиссия)';
      }
    }
    return 'Сумма × Курс × (1 - Комиссия)';
  }

  hasError() {//метод для проверки наличия ошибки
    return this.hasConnectionError;//возвращаем флаг наличия ошибки
  }
} 