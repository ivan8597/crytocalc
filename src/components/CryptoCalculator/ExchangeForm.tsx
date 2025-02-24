import React, { useState } from 'react';
import { UseFormReturn, SubmitHandler } from 'react-hook-form';
import { Button } from '../common/Button';

import { Modal } from '../Modal';
import type { Symbol as CryptoSymbol } from '../../services/cryptoService';
import type { ExchangeFormData } from '../../types';
import { ResultModal } from '../ResultModal';
import { useUnit } from 'effector-react';
import { $limits, setAmount } from '../../models/crypto';

interface ExchangeFormProps {//форма обмена
  form: UseFormReturn<ExchangeFormData>;//форма
  symbols: CryptoSymbol[];//символы
  isLoading: boolean;//флаг загрузки
  onSubmit: SubmitHandler<ExchangeFormData>;//функция отправки формы
}

export const ExchangeForm: React.FC<ExchangeFormProps> = ({//форма обмена
  form,//форма
  symbols,//символы
  isLoading,//флаг загрузки
  onSubmit//функция отправки формы
}) => {
  const [showConfirm, setShowConfirm] = useState(false);//флаг подтверждения
  const [showResult, setShowResult] = useState(false);//флаг результата
  const [success, setSuccess] = useState(false);//флаг 
  
  const { register, handleSubmit, formState: { errors }, getValues, reset, watch } = form;//регистрация, отправка, ошибки, значения, сброс 
  const { limits } = useUnit({
    limits: $limits
  });//лимиты

  // Следим за изменениями поля amount
  React.useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'amount') {
        setAmount(value.amount || ''); // Устанавливаем пустую строку если значение удалено
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const handleConfirm = async () => {//подтверждение обмена 
    setShowConfirm(false);//скрывает подтверждение
    try {
      await onSubmit(getValues());//отправляет значения
      setSuccess(true);//устанавливает флаг 
      setShowResult(true);//показывает результат
      reset();//сбрасывает форму
    } catch (error) {
      setSuccess(false);//устанавливает флаг 
      setShowResult(true);//показывает результат
    }
  };

  const handleResultClose = () => {//закрытие результата
    setShowResult(false);//скрывает результат
    if (success) {//если успех
      reset();//сбрасывает форму
    }
  };

  const symbolValue = watch('symbol');
  const selectedSymbol = symbols.find(s => s.symbol === symbolValue);
  const [base] = selectedSymbol ? selectedSymbol.symbol.split('_') : [''];

  return (
    <>
      <form 
        role="form"
        data-testid="exchange-form"
        onSubmit={handleSubmit(() => setShowConfirm(true))}
      >
        <div className="form-group">
          <label />
          <select 
            {...register('symbol')}
            className="select"
            data-testid="symbol-select"
          >
            <option value="">Выберите пару</option>
            {symbols.map(symbol => (
              <option key={symbol.symbol} value={symbol.symbol}>
                {symbol.base}/{symbol.quote}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="amount">Сумма для обмена</label>
          <div className="input-wrapper">
            <input
              {...register('amount', {
                required: 'Введите сумму',
                min: {
                  value: parseFloat(limits.min),
                  message: `Минимальная сумма ${limits.min} ${selectedSymbol?.base}`
                },
                max: {
                  value: parseFloat(limits.max),
                  message: `Максимальная сумма ${limits.max} ${selectedSymbol?.base}`
                }
              })}
              type="number"
              id="amount"
              className={`input ${errors.amount ? 'error' : ''}`}
              data-testid="amount-input"
              step="any"
              disabled={!selectedSymbol}
              placeholder={!selectedSymbol ? "Сначала выберите пару" : "Введите сумму"}
            />
            {selectedSymbol && (
              <>
                <div className="input-limits" data-testid="input-limits">
                  <span className="min-limit">Мин: {limits.min} {selectedSymbol.base}</span>
                  <span className="max-limit">Макс: {limits.max} {selectedSymbol.base}</span>
                </div>
                <span className="input-hint">Введите сумму в пределах указанных лимитов</span>
              </>
            )}
            {errors.amount && (
              <span className="error-message">{errors.amount.message}</span>
            )}
          </div>
        </div>

        <Button 
          type="submit"
          isLoading={isLoading}//флаг загрузки
          disabled={isLoading || !selectedSymbol}//отключение при загрузке
          data-testid="submit-button"//тестовый id
        >
          {isLoading ? 'Обмен...' : 'Обменять'}{/*если флаг загрузки, то показывает текст "Обмен...", иначе показывает текст "Обменять"*/}
        </Button>
      </form>

      {showConfirm && (
        <Modal
          title="Подтверждение обмена"
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirm}
        >
          <p>Вы действительно хотите совершить обмен?</p>
          <p>Сумма: {getValues().amount} {selectedSymbol?.base}</p>
          <p>Пара: {selectedSymbol?.base}/{selectedSymbol?.quote}</p>
        </Modal>
      )}

      <ResultModal
        isOpen={showResult}
        onClose={handleResultClose}
        success={success}
      />
    </>
  );
}; 