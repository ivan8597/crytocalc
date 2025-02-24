import React, { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}


//Выпадающий список для выбора торговой пары
// Принимает список опций через children
// Имеет встроенный placeholder "Выберите пару"

// Обертка form-group для группировки
// Label для подписи поля
// Select элемент для выбора
// Блок для отображения ошибок

// label: текст подписи поля
// error: текст ошибки 
// children: опции для выбора
// ref: для доступа к DOM элементу

// Имеет data-testid="symbol-select"
// Позволяет находить элемент в тестах
// Проверять выбранные значения

// Связь label с select
// Компонент используется в форме обмена для выбора криптовалютной пары

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    label,
    error,
    children,
    ...props
  }, ref) => (
    <div className="form-group">
      <label>{label}</label>
      <select
        ref={ref}
        className={`select ${error ? 'error' : ''}`}
        data-testid="symbol-select"
        {...props}
      >
        <option value="">Выберите пару</option>
        {children}
      </select>
      {error && <span className="error-message">{error}</span>}
    </div>
  )
);

Select.displayName = 'Select'; //имя компонента