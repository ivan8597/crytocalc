interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary';
}
// кнопка для формы
// пропсы:
// children - текст кнопки
// isLoading - флаг загрузки
// variant - вариант кнопки (primary, secondary)
// props - пропсы для кнопки
// возвращает кнопку с классами и текстом
// если isLoading true, то текст кнопки будет "Загрузка..."
// если variant primary, то кнопка будет зеленой
// если variant secondary, то кнопка будет серой
// если variant primary и isLoading true, то кнопка будет зеленой и будет показывать текст "Загрузка..."
// если variant secondary и isLoading true, то кнопка будет серой и будет показывать текст "Загрузка..."
// если variant primary и isLoading false, то кнопка будет зеленой и будет показывать текст children
// если variant secondary и isLoading false, то кнопка будет серой и будет показывать текст children
// если variant primary и isLoading true, то кнопка будет зеленой и будет показывать текст "Загрузка..."
// если variant secondary и isLoading true, то кнопка будет серой и будет показывать текст "Загрузка..."
// если variant primary и isLoading false, то кнопка будет зеленой и будет показывать текст children
// если variant secondary и isLoading false, то кнопка будет серой и будет показывать текст children

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  isLoading, 
  variant = 'primary',
  ...props 
}) => (
  <button 
    className={`button ${variant} ${isLoading ? 'loading' : ''}`}
    {...props}
  >
    {isLoading ? 'Загрузка...' : children}
  </button>
); 