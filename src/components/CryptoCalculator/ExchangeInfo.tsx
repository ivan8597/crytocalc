import React from 'react';
import { useUnit } from 'effector-react';
import { $selectedSymbol, $fee, $limits, $price, $isUpdatingFee, $calculatedAmount, $amount, $wsError } from '../../models/crypto';
import { FeeDisplay } from '../FeeDisplay';
import { CryptoService } from '../../services/cryptoService';

//компонент информации об обмене
export const ExchangeInfo: React.FC = () => {
  const { selectedSymbol, fee, limits, currentPrice, isUpdating, calculatedAmount, amount, wsError } = useUnit({//используем useUnit для получения данных из модели
    selectedSymbol: $selectedSymbol,//выбранный символ
    fee: $fee,//сбор платежа
    limits: $limits,//лимиты
    currentPrice: $price,//текущая цена
    isUpdating: $isUpdatingFee,//флаг обновления
    calculatedAmount: $calculatedAmount,//рассчитанная сумма
    amount: $amount,//сумма обмена
    wsError: $wsError // Получаем состояние ошибки
  });

  const cryptoService = CryptoService.getInstance();//получаем экземпляр сервиса
  const symbolInfo = selectedSymbol ? cryptoService.getSymbolInfo(selectedSymbol) : null;//получаем информацию о символе
  console.log('Symbol Info:', symbolInfo);//выводим информацию о символе
  
  // Получаем описание формулы
  const formulaInfo = symbolInfo ? {//если есть символ
    type: symbolInfo.formula_type,//тип формулы
    description: cryptoService.getFormulaDescription(symbolInfo),//описание формулы
    example: cryptoService.getFormulaExample(symbolInfo)//пример формулы
  } : null;//если нет символа
  console.log('Formula Info:', formulaInfo);//выводим информацию о формуле
  console.log('Formula Info:', formulaInfo);//выводим информацию о формуле

  // const hasError = cryptoService.hasError();

  if (!selectedSymbol) return null;//если нет символа, то ничего не возвращает

  const [base, quote] = selectedSymbol.split('_');//разделяем символ на базовую и котируемую валюты

  // Проверяем условия для скидки
  const showDiscount = selectedSymbol === 'BTC_USDT' && 
                      typeof amount === 'string' && // проверяем тип
                      amount.trim() !== '' && // проверяем на пустоту после удаления пробелов
                      !isNaN(Number(amount)) && // проверяем что это число
                      Number(amount) > 5; // проверяем условие скидки

  console.log('Amount:', amount, 'ShowDiscount:', showDiscount); // для отладки

  console.log('ExchangeInfo state:', { fee, isUpdating, wsError }); // Добавим для отладки

  return (
    <div className="exchange-info" data-testid="exchange-info">{/*блок информации об обмене*/}
      <FeeDisplay 
        fee={fee || ''} 
        isUpdating={isUpdating}
        hasError={wsError} // Передаем состояние ошибки
      />
      
      {limits && ( /*блок информации о лимитах*/
        <div className="limits-info" data-testid="limits-info">{/*блок информации о лимитах*/}
          Лимиты: от {limits.min} до {limits.max} {base.toLowerCase()}{/*лимиты от минимальной суммы до максимальной суммы в нижнем регистре*/}
        </div>
      )}
      
      {currentPrice && ( /*блок информации о цене*/
        <>
          <div className="price-info" data-testid="price-display">{/*блок информации о цене*/}
            Курс: 1 {base} = {currentPrice} {quote}{/*курс 1 базовой валюты равен текущей цене котируемой валюты*/}
          </div>
          {formulaInfo && ( /*блок информации о формуле*/
            <div className="formula-info" data-testid="formula-info">{/*блок информации о формуле*/}
              {formulaInfo.type === 'custom' && ( /*если тип формулы "custom", то отображаем "Premium"*/
                <span className="formula-badge">Premium</span>
              )}
              <div className="formula-details">{/*блок информации о формуле*/}
                <p className="formula-description">{formulaInfo.description}{/*описание формулы*/}</p>
                <p className="formula-example">Пример расчета: {formulaInfo.example}{/*пример расчета*/}</p>
              </div>
            </div>
          )}
        </>
      )}

      {calculatedAmount && ( /*блок информации о рассчитанной сумме*/
        <div className="result-info" data-testid="result-amount">{/*блок информации о рассчитанной сумме*/}
          Вы получите: {calculatedAmount} {quote}{/*вы получите рассчитанную сумму котируемой валюты*/}
        </div>
      )}

      {/* информация о скидке появляется если все условия выполнены */}
      {showDiscount && (
        <div className="discount-info" data-testid="discount-info"> {/*блок информации о скидке*/}
          <span className="discount-badge">Скидка 30%</span>
          <span className="discount-description"> 
            При обмене более 5 BTC применяется скидка на комиссию
          </span>
        </div>
      )}
    </div>
  );
}; 