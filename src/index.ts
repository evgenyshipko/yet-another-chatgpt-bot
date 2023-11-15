import {Telegraf} from 'telegraf';
import * as dotenv from 'dotenv';
import {logError, logInfo} from './utils/logs';
import {configure} from 'log4js';
import dataSource from "./db/ormconfig";
import {messageHandler} from "./handlers/messageHandler";
// import {Redis} from "@telegraf/session/redis";
import {commandHandler} from "./handlers/commandHandler";
import {startHandler} from "./handlers/startHandler";

(async () => {
  dotenv.config();

  configure({
    appenders: {
      to_file: { type: 'file', filename: process.env.LOG_PATH + '/bot.log' },
      to_console: { type: 'console' },
    },
    categories: {
      default: { appenders: ['to_file', 'to_console'], level: 'all' },
    },
  });

  await dataSource.initialize()

  const bot = new Telegraf(process.env.BOT_TOKEN);

  // делаем возможным отвечать на реплаи в группах
  bot.telegram.getMe().then((botInfo) => {
    // @ts-ignore
    bot.options.username = botInfo.username
  })

  // TODO: разобраться зачем нужны сессии
  // const store = Redis({
  //   url: process.env.REDIS_URL,
  // });
  //
  // bot.use(session({store}));

  //хэндлеры обработки сообщений и команд (основная логика)
  startHandler(bot)
  commandHandler(bot)
  messageHandler(bot)

  // запуск бота
  bot.launch()

  // ловим ошибки
  bot.catch((err, ctx) => {
    logError(err);
    ctx.reply('Что-то пошло не так, попробуйте снова!');
  });

  // гасим приложение культурно
  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.once(signal, () => {
      bot.stop(signal);
      logInfo('STOP');
    });
  }
})();
