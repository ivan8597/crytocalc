import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  limits?: {
    min: string;
    max: string;
    currency: string;
  };
}


//Input (поле ввода):
//   Показывает подпись над полем
//   Отображает ограничения (минимум/максимум) для суммы
//   Выводит подсказки для пользователя
//   Показывает ошибки красным цветом
//   Связывает label с полем ввода для доступности
//   Button (кнопка):
//   Два варианта оформления (primary/secondary)
//   Показывает состояние загрузки
//   Меняет текст на "Загрузка..." при обработке
//   Блокируется при загрузке
//   Может быть зеленой или серой
// Select (выпадающий список):
// Для выбора пары криптовалют
// Показывает подпись над списком
// Отображает ошибки
// Имеет placeholder "Выберите пару"
// Все компоненты поддерживают тестирование (data-testid)
// Понятная обратная связь для пользователя
// Переиспользуемость в разных частях приложения
// Эти компоненты вместе создают удобный интерфейс для ввода данных при обмене криптовалю
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label,// текст лейбла
    error,// текст ошибки
    hint,// текст подсказки
    limits,// объект с ограничениями
    name,// имя инпута
    ...props// пропсы для инпута
  }, ref) => (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <div className="input-wrapper">
        <input
          ref={ref}
          id={name}
          className={`input ${error ? 'error' : ''}`}
          data-testid={name ? `${name}-input` : undefined}
          name={name}
          {...props}
        />
        {limits && (
          <div className="input-limits" data-testid="input-limits"> 
            <span className="min-limit">Мин: {limits.min} {limits.currency}</span>
            <span className="max-limit">Макс: {limits.max} {limits.currency}</span>
          </div>
        )}
        {hint && <span className="input-hint">{hint}</span>}
        {error && <span className="error-message">{error}</span>}
      </div>
    </div>
  )
);

Input.displayName = 'Input'; 