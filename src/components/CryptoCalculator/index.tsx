import React, { useEffect } from 'react';
import { useExchange } from '../../hooks/useExchange';
import { ExchangeForm } from './ExchangeForm';
import { ExchangeInfo } from './ExchangeInfo';
import { ErrorDisplay } from './ErrorDisplay';
import { loadSymbolsFx } from '../../models/crypto';
//компонент калькулятора обмена криптовалют
export const CryptoCalculator: React.FC = () => {
  const { 
    form,//форма
    symbols,//символы
    error,//ошибка
    isLoading,//флаг загрузки
    handleExchange//функция обмена
  } = useExchange();//используем хук обмена

  // Загружаем список пар при монтировании
  useEffect(() => {
    loadSymbolsFx();
  }, []);

  const handleRetry = async () => {//функция повтора
    await handleExchange(form.getValues());//обмен значений формы
  };

  return (
    <div className="crypto-calculator" data-testid="crypto-calculator">{/*блок калькулятора обмена криптовалют*/}
      <h2>Калькулятор обмена криптовалют</h2>
      
      <ExchangeForm
        form={form}//форма
        symbols={symbols}//символы
        isLoading={isLoading}//флаг загрузки
        onSubmit={handleExchange}//функция обмена
      />

      <ExchangeInfo /> {/*блок информации об обмене*/}

      {error && ( /*блок ошибки*/
        <ErrorDisplay
          error={error}//ошибка
          onRetry={handleRetry}//повтор запроса
          isRetrying={isLoading}//флаг загрузки
        />
      )}
    </div>
  );
}; 