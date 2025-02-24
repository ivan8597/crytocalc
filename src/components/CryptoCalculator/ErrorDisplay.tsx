import { Button } from "../common/Button";

interface ErrorDisplayProps {
  error: string | null;
  onRetry: () => Promise<void>;
  isRetrying: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({//компонент ошибки
  error,//ошибка
  onRetry,//функция повтора
  isRetrying//флаг загрузки
}) => {
  if (!error) return null;//если нет ошибки, то ничего не возвращает

  const showRetryButton = error.includes('failed') || error.includes('ошибка сервера');//показывает кнопку повтора если ошибка сети или ошибка сервера 

  return (
    <div className="error-message" data-testid="error-message">{/*блок ошибки*/}
      {error === 'NetworkError' ? 'Ошибка сети' : error}{/*если ошибка сети, то показывает текст "Ошибка сети", иначе показывает текст ошибки*/}
      {showRetryButton && ( /*если кнопка повтора, то показывает кнопку повтора*/
        <Button 
          variant="secondary" /*кнопка повтора*/
          onClick={onRetry} /*функция повтора*/
          isLoading={isRetrying} /*флаг загрузки*/
          data-testid="retry-button" /*тестовый id*/
        >
          {isRetrying ? 'Повторная попытка...' : 'Повторить'}{/*если флаг загрузки, то показывает текст "Повторная попытка...", иначе показывает текст "Повторить"*/}
        </Button>
      )}
    </div>
  );
}; 