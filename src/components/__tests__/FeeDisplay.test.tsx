import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeeDisplay } from '../FeeDisplay';

describe('FeeDisplay', () => { //тест для проверки отображения элемента с комиссией
  it('должен отображать элемент с комиссией', () => { //тест для проверки на отображение элемента с комиссией
    render(<FeeDisplay fee="1.00" isUpdating={false} />); //рендерим компонент с комиссией
    expect(screen.getByTestId('fee-display')).toBeInTheDocument(); //проверяем, что элемент с комиссией отображается
  });

  it('должен отображать значение комиссии', () => { //тест для проверки отображения значения комиссии
    render(<FeeDisplay fee="1.5" isUpdating={false} />); //рендерим компонент с комиссией
    expect(screen.getByTestId('fee-value')).toHaveTextContent('1.5'); //проверяем, что значение комиссии отображается
  });

  it('должен отображать индикатор обновления при обновлении', () => { //тест для проверки отображения индикатора обновления
    render(<FeeDisplay fee="1.5" isUpdating={true} />); //рендерим компонент с комиссией 
    expect(screen.getByTestId('fee-update-indicator')).toBeInTheDocument(); //проверяем, что индикатор обновления отображается 
  });

  it('должен не отображать индикатор обновления при отсутствии обновления', () => { //тест для проверки отсутствия индикатора обновления
    render(<FeeDisplay fee="1.5" isUpdating={false} />); //рендерим компонент с комиссией
    expect(screen.queryByTestId('fee-update-indicator')).not.toBeInTheDocument(); //проверяем, что индикатор обновления не отображается
  });

  it('должен отображать сообщение об ошибке при hasError', () => { //тест для проверки отображения сообщения об ошибке
    render(<FeeDisplay fee="1.5" hasError={true} />); //рендерим компонент с ошибкой
    expect(screen.getByTestId('fee-error')).toBeInTheDocument(); //проверяем, что сообщение об ошибке отображается
  });
}); 