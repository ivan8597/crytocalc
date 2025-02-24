import express, { Request, Response } from 'express';
import cors from 'cors';

import { WebSocketServer } from 'ws'; 
import { Server } from 'http';


const app = express();//Создаем сервер
app.use(cors());// Включаем CORS для разрешения кросс-доменных запросов
app.use(express.json()); // Добавляем парсинг JSON

// API сервер для тестирования криптовалютного калькулятора
// Сервер обрабатывает 3 основных эндпоинта:
// - /api/symbols - список доступных пар
// - /api/ticker/price - текущие цены
// - /api/fee - комиссии и лимиты

// Поддерживаются как прямые пары (BTC_USDT), так и обратные (USDT_BTC)
const symbols = [ // Массив объектов, представляющих доступные торговые пары
  {
    symbol: "BTC_USDT",
    base: "BTC",    // что продаем
    quote: "USDT",  // что получаем
    formula_type: "custom", // custom
    formula_id: "btc_usdt"  // id формулы
  },
  // Добавлены обратные пары 
  {
    symbol: "USDT_BTC",// обратная пара
    base: "USDT",
    quote: "BTC",
    formula_type: "default"
  },
  {
    symbol: "ETH_USDT",
    base: "ETH",
    quote: "USDT",
    formula_type: "default"
  },
  {
    symbol: "USDT_ETH",  // обратная пара
    base: "USDT",
    quote: "ETH",
    formula_type: "default"
  },
  {
    symbol: "AB_CD",
    base: "AB",
    quote: "CD",
    formula_type: "custom",
    formula_id: "abcd"
  },
  {
    symbol: "XYZ_USDT",
    base: "XYZ",
    quote: "USDT",
    formula_type: "custom",
    formula_id: "premium"
  }
];

// Храним только базовые цены, для обратных пар делаем обратный расчет
const basePrices = {
  'BTC_USDT': '30000.00',  // 1 BTC = 30000 USDT
  'ETH_USDT': '2000.00',   // 1 ETH = 2000 USDT
  'AB_CD': '100.00', // 1 AB = 100 CD
  'XYZ_USDT': '50.00' // 1 XYZ = 50 USDT
};

// Эндпоинт для получения списка доступных торговых пар
app.get('/api/symbols', (req: Request, res: Response) => { 
  res.json(symbols); //отправляем список доступных торговых пар
});

// Эндпоинт для получения текущей цены указанной торговой пары
app.get('/api/ticker/price', (req: Request, res: Response) => {
  const symbol = req.query.symbol as string; // Извлекаем символ торговой пары из параметров запроса
  let price: string;

  if (symbol.startsWith('USDT_')) {
    // Для обратных пар делаем обратный расчет
    const directPair = symbol.split('_').reverse().join('_'); // USDT_BTC -> BTC_USDT
    const directPrice = parseFloat(basePrices[directPair]); // Получаем цену для прямой пары и преобразуем в число
    price = (1 / directPrice).toFixed(8); // Обратная цена с 8 знаками после запятой
  } else {
    price = basePrices[symbol] || '0.00'; // Если пара не обратная, используем базовую цену
  }

  res.json({
    symbol,               // Символ торговой пары, для которой запрашивается цена
    price,                // Текущая цена для указанной торговой пары
    timestamp: Date.now() // Временная метка запроса
  });
});

// Комиссия, которая меняется каждые 10 минут

const generateRandomFee = () => {
  return (Math.random() * 1.5 + 0.5).toFixed(2); // Генерируем случайную комиссию от 0.50% до 2.00%
};

let currentFee = generateRandomFee(); // Инициализируем текущую комиссию случайным значением

// Создаем HTTP сервер
const server = new Server(app);

// Создаем WebSocket сервер, привязанный к HTTP серверу
const wss = new WebSocketServer({ server });

// Отправляем обновления всем клиентам
setInterval(() => {
  const newFee = generateRandomFee();
  wss.clients.forEach(client => {
    client.send(JSON.stringify({
      type: 'FEE_UPDATE',
      fee: newFee
    }));
  });
}, 60000);

// Эндпоинт для получения комиссии
app.get('/api/fee', (req: Request, res: Response) => {
  res.json({
    symbol: req.query.symbol, //символ пары
    fee: currentFee, //комиссия
    min_amount: '0.001', //минимальная сумма
    max_amount: '10.0', //максимальная сумма
    timestamp: Date.now() //время
  });
});

// Добавляем обработчик POST запроса для обмена
app.post('/api/exchange', async (req: Request, res: Response) => {
  try {
    const { amount, symbol } = req.body; //сумма и символ пары

    // Проверяем входные данные
    if (!amount || !symbol) { //если сумма или символ пары не указаны
      return res.status(400).json({ //возвращаем ошибку
        error: 'Необходимо указать сумму и символ пары' //сообщение об ошибке
      });
    }

    // Имитируем задержку реального API
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Возвращаем успешный результат
    res.json({
      message: 'Обмен успешно выполнен', 
      amount, //сумма
      symbol, //символ пары
      timestamp: Date.now() //время
    });
  } catch (error) {
    console.error('Exchange error:', error); //выводим сообщение об ошибке
    res.status(500).json({ //возвращаем ошибку
      error: 'Произошла ошибка при выполнении обмена' //сообщение об ошибке
    });
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

 