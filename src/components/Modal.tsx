import React from 'react';
import { Button } from './common/Button';


interface ModalProps {//компонент модального окна
  title: string;//заголовок
  children: React.ReactNode;//дочерние элементы
  onClose: () => void;//функция закрытия
  onConfirm?: () => void;//функция подтверждения
  showActions?: boolean;//флаг отображения кнопок
}

export const Modal: React.FC<ModalProps> = ({//компонент модального окна
  title,//заголовок
  children,//дочерние элементы
  onClose,//функция закрытия
  onConfirm,//функция подтверждения
  showActions = true//флаг отображения кнопок
}) => {
  return (
    <div className="modal-overlay">{/*блок модального окна*/}
      <div className="modal" data-testid="confirm-modal">{/*блок модального окна*/}
        <h3>{title}</h3>{/*заголовок*/}
        <div className="modal-content">{/*блок контента*/}
          {children} {/*дочерние элементы*/}
        </div>
        <div className="modal-actions">{/*блок действий*/}
          {showActions ? (/*блок действий*/
            <>
              <Button variant="secondary" onClick={onClose}> {/*кнопка отмены*/}
                Отмена
              </Button>
              <Button onClick={onConfirm}>{/*кнопка подтверждения*/}
                Подтвердить
              </Button>
            </>
          ) : (
            <Button onClick={onClose}> {/*кнопка закрытия*/}
              Закрыть
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}; 