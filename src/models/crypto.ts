import { createStore, createEvent, createEffect } from 'effector';
import { CryptoService } from '../services/cryptoService';
import type { Symbol as CryptoSymbol } from '../services/cryptoService';
import type { ExchangeFormData } from '../types';

// События
export const setSymbol = createEvent<string>();//установка символа
export const setAmount = createEvent<string>();//установка суммы
export const resetForm = createEvent();//сброс формы
export const updateFeeManually = createEvent<string>();//обновление комиссии
export const setErrorManually = createEvent<string>();//установка ошибки
export const setWsError = createEvent<boolean>();

// Сторы
export const $symbols = createStore<CryptoSymbol[]>([]);//создание стора символов
export const $selectedSymbol = createStore('');//создание стора символа
export const $amount = createStore('');//создание стора суммы
export const $price = createStore('');//создание стора цены
export const $fee = createStore('');//создание стора комиссии
export const $limits = createStore({ min: '0', max: '0' });//создание стора лимитов
export const $isLoading = createStore(false);//создание стора флага загрузки
export const $error = createStore<string | null>(null);//создание стора ошибки
export const $isUpdatingFee = createStore(false);//создание стора флага обновления комиссии
export const $wsError = createStore(false);//создание стора ошибки WebSocket

// Эффекты
export const loadSymbolsFx = createEffect(async () => {//загрузка символов
  const service = CryptoService.getInstance();
  return await service.getSymbols();//возвращаем символы
});

export const loadPriceAndFeeFx = createEffect(async (symbol: string) => {//загрузка цены и комиссии
  const service = CryptoService.getInstance();
  const [priceData, feeData] = await Promise.all([//ожидание завершения всех промисов
    service.getPrice(symbol),//получение цены
    service.getFee(symbol)//получение комиссии
  ]);
  return { price: priceData.price, ...feeData };//возвращаем цену и комиссию
});

export const exchangeFx = createEffect(async (data: ExchangeFormData) => {//обмен данных
  const service = CryptoService.getInstance();
  return await service.exchange(data);//обмен данных
});

// Подписки
$symbols.on(loadSymbolsFx.doneData, (_, symbols) => symbols);//обновление символов
$selectedSymbol
  .on(setSymbol, (_, symbol) => symbol)//обновление символа
  .reset(resetForm);//сброс символа
$amount
  .on(setAmount, (_, amount) => amount)//обновление суммы
  .reset(resetForm);//сброс суммы
$price.on(loadPriceAndFeeFx.doneData, (_, data) => data.price);//обновление цены
$fee
  .on(loadPriceAndFeeFx.doneData, (_, data) => data.fee)//обновление комиссии
  .on(updateFeeManually, (_, fee) => fee);//обновление комиссии
$limits.on(loadPriceAndFeeFx.doneData, (_, data) => ({//обновление лимитов
  min: data.min_amount,//обновление минимальной суммы
  max: data.max_amount//обновление максимальной суммы
}));
$isLoading.on(exchangeFx.pending, (_, pending) => pending);//обновление флага загрузки
$error
  .on(exchangeFx.failData, (_, error) => error.message)//обновление ошибки
  .on(setErrorManually, (_, error) => error)//обновление ошибки
  .reset(resetForm);//сброс ошибки
$isUpdatingFee
  .on(updateFeeManually, () => true)//обновление флага обновления комиссии
  .on(loadPriceAndFeeFx.done, () => false)//обновление флага обновления комиссии
  .reset(resetForm);//сброс флага обновления комиссии
$wsError
  .on(setWsError, (_, error) => error)
  .reset(resetForm); // Добавим сброс при resetForm

// Функция для расчета суммы
const calculateAmount = (amount: string, price: string, fee: string, symbol?: string): string => {//расчет суммы
  if (!amount || !price || !fee || !symbol) return '';//если сумма, цена, комиссия или символ нет, то возвращаем пустую строку
  
  const inputAmount = parseFloat(amount);//преобразование суммы в число
  const priceValue = parseFloat(price);//преобразование цены в число
  const feeValue = parseFloat(fee) / 100;//преобразование комиссии в число
  
  if (isNaN(inputAmount) || isNaN(priceValue) || isNaN(feeValue)) return '';//если сумма, цена или комиссия не являются числами, то возвращаем пустую строку

  // Получаем информацию о символе
  const symbolInfo = $symbols.getState().find(s => s.symbol === symbol);//получение информации о символе
  if (!symbolInfo) return '';//если символ не найден, то возвращаем пустую строку

  // Используем сервис для расчета с учетом кастомных формул
  const result = CryptoService.getInstance().calculateAmount(inputAmount, price, fee, symbolInfo);//расчет суммы
  
  return result.toFixed(2);
};

// Стор для расчетной суммы
export const $calculatedAmount = createStore<string>('')//создание стора расчетной суммы
  .on($amount, (_, amount) => { //обновление расчетной суммы
    const price = $price.getState();//получение цены
    const fee = $fee.getState();//получение комиссии
    const symbol = $selectedSymbol.getState();//получение символа
    return calculateAmount(amount, price, fee, symbol);//расчет суммы
  })
  .on($price, (_, price) => { //обновление расчетной суммы
    const amount = $amount.getState();//получение суммы
    const fee = $fee.getState();//получение комиссии
    const symbol = $selectedSymbol.getState();//получение символа
    return calculateAmount(amount, price, fee, symbol);//расчет суммы
  })
  .on($fee, (_, fee) => { //обновление расчетной суммы
    const amount = $amount.getState();//получение суммы//получение суммы
    const price = $price.getState();//получение цены//получение цены
    const symbol = $selectedSymbol.getState();//получение символа
    return calculateAmount(amount, price, fee, symbol);//расчет суммы//расчет суммы
  })
  .on($selectedSymbol, (_, symbol) => { //обновление расчетной суммы
    const amount = $amount.getState();//получение суммы
    const price = $price.getState();//получение цены
    const fee = $fee.getState();//получение комиссии
    return calculateAmount(amount, price, fee, symbol);//расчет суммы
  })
  .reset(resetForm); //сброс расчетной суммы