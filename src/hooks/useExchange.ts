import { useUnit } from 'effector-react';
import { useForm, UseFormReturn, SubmitHandler } from 'react-hook-form';
import { 
  $symbols, $selectedSymbol, $amount, exchangeFx, $fee, $error,
  $isLoading, loadPriceAndFeeFx, updateFeeManually, setSymbol, setAmount
} from '../models/crypto';
import type { Symbol as CryptoSymbol } from '../services/cryptoService';
import type { ExchangeFormData } from '../types';
import { useEffect } from 'react';
import { CryptoService } from '../services/cryptoService';

interface UseExchangeReturn { //хук обмена
  form: UseFormReturn<ExchangeFormData>; //форма
  symbols: CryptoSymbol[]; //символы
  error: string | null; //ошибка
  selectedSymbol: string; //выбранный символ
  amount: string; //сумма
  fee: string; //комиссия
  isLoading: boolean; //флаг загрузки
  handleExchange: SubmitHandler<ExchangeFormData>; //функция обмена
}

export const useExchange = (): UseExchangeReturn => { //хук обмена
  const {
    symbols, //символы
    selectedSymbol, //выбранный символ
    amount, //сумма
    fee, //комиссия
    error, //ошибка
    isLoading //флаг загрузки
  } = useUnit({ //используем useUnit для получения данных из стора
    symbols: $symbols, //символы
    selectedSymbol: $selectedSymbol, //выбранный символ
    amount: $amount, //сумма
    fee: $fee, //комиссия
    error: $error, //ошибка
    isLoading: $isLoading //флаг загрузки
  });
  
  const form = useForm<ExchangeFormData>({//форма
    defaultValues: { //значения по умолчанию
      symbol: '', //символ
      amount: '' //сумма
    },
    mode: 'onChange' //режим изменения
  });

 
  useEffect(() => {//синхронизация значений формы со сторами
    const subscription = form.watch((value) => {//наблюдение за изменениями в форме
      if (value.symbol) {//если символ
        setSymbol(value.symbol); //установка символа
        loadPriceAndFeeFx(value.symbol); //загрузка цены и комиссии
      }
      if (value.amount) {//если сумма
        setAmount(value.amount); //установка суммы
      }
    });
    return () => subscription.unsubscribe(); //отмена наблюдения
  }, [form]);

  // Подключаем WebSocket
  useEffect(() => {
    const cryptoService = CryptoService.getInstance(); //получение экземпляра сервиса
    cryptoService.connectWebSocket((newFee) => { //подключение к WebSocket
      updateFeeManually(newFee); //обновление комиссии
    });

    return () => {
      cryptoService.disconnect(); //отключение от WebSocket
    };
  }, []);

  const handleSubmit = async (data: ExchangeFormData) => { //обмен данных
    try {
      await exchangeFx(data); //обмен данных
      form.reset(); //сброс формы
      setSymbol(''); //сброс символа
      setAmount(''); //сброс суммы
    } catch (error) {
      // Ошибка обрабатывается в модели
    }
  };

  return {
    form, //форма
    symbols, //символы
    error, //ошибка
    selectedSymbol, //выбранный символ
    amount, //сумма
    fee, //комиссия
    isLoading, //флаг загрузки
    handleExchange: handleSubmit //обмен данных
  };
}; 