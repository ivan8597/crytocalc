import { it, expect, vi, describe } from 'vitest';
import { fork, allSettled } from 'effector';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider } from 'effector-react';
import { ExchangeForm } from '../CryptoCalculator/ExchangeForm';
import { loadSymbolsFx,  loadPriceAndFeeFx, $limits, $selectedSymbol } from '../../models/crypto';
import { useForm } from 'react-hook-form';
import type { ExchangeFormData } from '../../types';

const TestComponent = () => { //тестовый компонент для проверки формы обмена
  const form = useForm<ExchangeFormData>({ //используем useForm для управления формой
    defaultValues: {
      symbol: 'BTC_USDT', //значение по умолчанию для символа
      amount: '1' //значение по умолчанию для суммы
    }
  });
  
  return (
    <ExchangeForm 
      form={form} //передаем форму в компонент ExchangeForm
      symbols={[{ 
        symbol: 'BTC_USDT', //значение по умолчанию для символа
        base: 'BTC', //значение по умолчанию для базовой валюты
        quote: 'USDT', //значение по умолчанию для котируемой валюты
        formula_type: 'custom', //значение по умолчанию для типа формулы
        formula_id: 'premium_btc' //значение по умолчанию для идентификатора формулы
      }]}
      isLoading={false} //значение по умолчанию для загрузки
      onSubmit={async () => {}} //функция отправки формы
    />
  );
};

it('должен показывать подсказки с лимитами для ввода суммы', async () => { //тест для проверки на отображение лимитов для ввода суммы
  const scope = fork({
    values: [
      [$limits, { min: '0.001', max: '10.0' }], //значение по умолчанию для лимитов
      [$selectedSymbol, 'BTC_USDT'] //значение по умолчанию для символа
    ]
  });
  
  await allSettled(loadSymbolsFx, { scope }); //загружаем символы
  await allSettled(loadPriceAndFeeFx, { scope, params: 'BTC_USDT' }); //загружаем цену и комиссию для пары BTC_USDT

  render(
    <Provider value={scope}>
      <TestComponent />
    </Provider>
  );

  // Ждем обновления формы
  await act(async () => { //ожидаем обновления формы
    const select = screen.getByTestId('symbol-select'); //получаем элемент выбора символа
    fireEvent.change(select, { target: { value: 'BTC_USDT' } }); //изменяем значение выбора символа на BTC_USDT
  });

  // Проверяем отображение лимитов
  const limitsHint = await screen.findByTestId('input-limits'); //получаем элемент с лимитами
  expect(limitsHint).toHaveTextContent('Мин: 0.001 BTC'); //проверяем отображение лимитов
  expect(limitsHint).toHaveTextContent('Макс: 10.0 BTC'); //проверяем отображение лимитов
});

describe('ExchangeForm валидация', () => { //тест на валидацию формы
  const TestValidationForm = () => {
    const scope = fork({ //создаем scope для тестирования
      values: [
        [$limits, { min: '0.001', max: '10.0' }], //значение по умолчанию для лимитов
        [$selectedSymbol, 'BTC_USDT'] //значение по умолчанию для символа
      ]
    });

    const form = useForm({ //создаем форму для тестирования
      defaultValues: { symbol: 'BTC_USDT', amount: '' } //значение по умолчанию для символа и суммы
    });

    return (
      <Provider value={scope}> 
        <ExchangeForm //передаем scope в компонент ExchangeForm
          form={form} 
          symbols={[{ 
            symbol: 'BTC_USDT',
            base: 'BTC',
            quote: 'USDT',
            formula_type: 'custom' as const,
            formula_id: 'btc_usdt'
          }]}
          isLoading={false}
          onSubmit={vi.fn()}
        />
      </Provider>
    );
  };

  it('должен проверять минимальную сумму', async () => {
    render(<TestValidationForm />);
    
    const input = screen.getByTestId('amount-input'); //получаем элемент ввода суммы
    fireEvent.change(input, { target: { value: '0.0001' } }); //изменяем значение ввода суммы на 0.0001
    
    const limits = screen.getByTestId('input-limits'); //получаем элемент с лимитами
    expect(limits).toHaveTextContent('Мин: 0.001 BTC'); //проверяем отображение лимитов
  });

  it('должен проверять максимальную сумму', async () => {
    render(<TestValidationForm />);
    
    const input = screen.getByTestId('amount-input'); //получаем элемент ввода суммы
    fireEvent.change(input, { target: { value: '11' } }); //изменяем значение ввода суммы на 11
    
    const limits = screen.getByTestId('input-limits'); //получаем элемент с лимитами
    expect(limits).toHaveTextContent('Макс: 10.0 BTC'); //проверяем отображение лимитов
  });

  it('должен разрешать корректные значения', () => {
    render(<TestValidationForm />);
    
    const input = screen.getByTestId('amount-input'); //получаем элемент ввода суммы
    fireEvent.change(input, { target: { value: '5' } }); //изменяем значение ввода суммы на 5
    
    expect(screen.queryByText(/ошибка/i)).not.toBeInTheDocument(); //проверяем, что ошибка не отображается
  });

 
}); 