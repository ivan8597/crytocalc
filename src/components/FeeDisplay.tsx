import React from 'react';

interface FeeDisplayProps {//компонент отображения комиссии
  fee: string;//комиссия
  isUpdating?: boolean;//флаг обновления
  hasError?: boolean; // Добавляем флаг ошибки
}

export const FeeDisplay: React.FC<FeeDisplayProps> = ({ fee, isUpdating, hasError }) => {
  console.log('FeeDisplay props:', { fee, isUpdating, hasError });

  if (hasError || fee === 'error') {
    return (
      <div className="fee-error" data-testid="fee-error">
        <span className="error-icon">⚠</span>
        <span>Ошибка подключения к серверу комиссий</span>
        <button 
          onClick={() => window.location.reload()}
          className="retry-button"
        >
          Обновить
        </button>
      </div>
    );
  }

  return (
    <div className="fee-info" data-testid="fee-display">{/*блок информации о комиссии*/}
      Комиссия: 
      <span data-testid="fee-value-container">{/*блок значения комиссии*/}
        <span data-testid="fee-value">{fee}</span>%{/*значение комиссии*/}
      </span>
      {isUpdating && (/*блок обновления*/
        <span 
          className="update-indicator" //блок обновления
          data-testid="fee-update-indicator" //блок обновления
          title="Комиссия обновляется каждую минуту" //блок обновления
        >⟳</span>
      )}
      <small className="fee-update-info">
        Обновляется каждую минуту
      </small>
    </div>
  );
}; 