import '@testing-library/jest-dom';


//глобальное окружение
declare global { 
  interface Window {
    WebSocket: typeof WebSocket;
  }
}
//мок WebSocket
class WebSocketMock {
  onopen: (() => void) | null = null;//открытие
  onmessage: ((event: any) => void) | null = null;//сообщение
  onclose: (() => void) | null = null;//закрытие
  onerror: ((error: any) => void) | null = null;// ошибка
  readyState = WebSocket.OPEN;//состояние WebSocket

  constructor() {
    setTimeout(() => this.onopen?.(), 0);//установка времени открытия 
  }

  close() {
    this.onclose?.();//закрытие
  }

  send() {}//отправка
}



// @ts-ignore
global.WebSocket = WebSocketMock; 