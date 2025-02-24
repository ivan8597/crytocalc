import React from 'react';
import { Modal } from './Modal';


interface ResultModalProps {//компонент модального окна результата
  isOpen: boolean;//флаг открытия
  onClose: () => void;//функция закрытия
  success?: boolean;//флаг успешности
}

export const ResultModal: React.FC<ResultModalProps> = ({ isOpen, onClose, success = true }) => {//компонент модального окна результата
  if (!isOpen) return null;//если не открыто, то ничего не возвращает

  return ( //компонент модального окна результата
    <Modal
      title={success ? "Успех" : "Ошибка"} //заголовок
      onClose={onClose} //функция закрытия
      showActions={false} //флаг отображения кнопок
    >
      <div className="result-message"> {/*блок сообщения результата*/}
        {success ? ( /*блок успешного выполнения обмена*/
          <>
            <span className="success-icon">✓</span> 
            <p>Обмен успешно выполнен</p>
          </>
        ) : (
          <>
            <span className="error-icon">✗</span> {/*блок ошибки*/}
            <p>Не удалось выполнить обмен</p>
          </>
        )}
      </div>
    </Modal>
  );
}; 