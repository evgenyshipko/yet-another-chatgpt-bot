import {session, Telegraf} from 'telegraf';
import * as dotenv from 'dotenv';
import {logBotError, logBotInfo, logButtonPush} from './utils/logs';
import {configure} from 'log4js';
import {createUserIfNotExist} from "./utils/user";
import dataSource from "./db/ormconfig";
import {Keyboard} from "telegram-keyboard";
import {buyHandler, clearContextHandler, Commands, helpHandler, profileHandler} from "./commands";
import {messageHandler} from "./main";

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

  // TODO: разобраться с тем, что делают сессии
  bot.use(session());

  bot.start(async (ctx) => {
    const tgUser = ctx.update.message.from;

    if (tgUser.is_bot){
      return;
    }

    await createUserIfNotExist({
      tgId: tgUser.id,
      nickname: tgUser.username,
      firstName: tgUser.first_name,
      lastName: tgUser.last_name
    })

    const keyboard = Keyboard.make([
        Commands.BUY,
        Commands.PROFILE,
        Commands.HELP,
        Commands.RESET_CONTEXT,
      // @ts-ignore
    ], {wrap: (row, index, button) => [1, 3].includes(index)})

    logButtonPush('/start', ctx.chat.id);
    ctx.reply('Добро пожаловать! Просто пишите в чат, gpt-ассистент будет вам отвечать 😊', keyboard.reply())
  });

  //слушаем команды клавиатуры
  helpHandler(bot)
  buyHandler(bot)
  profileHandler(bot)
  clearContextHandler(bot)

  //хэндлер обработки сообщений (основная логика)
  messageHandler(bot)

  // запуск бота
  bot.launch()

  // ловим ошибки
  bot.catch((err, ctx) => {
    logBotError(err);
    ctx.reply('Что-то пошло не так, попробуйте снова!');
  });

  // гасим приложение культурно
  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.once(signal, () => {
      bot.stop(signal);
      logBotInfo('STOP');
    });
  }
})();
