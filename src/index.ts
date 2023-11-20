import {Telegraf} from 'telegraf';
import * as dotenv from 'dotenv';
import {log} from './utils/logs';
import dataSource from "./db/ormconfig";
import {messageHandler} from "./handlers/messageHandler";
import {commandHandler} from "./handlers/commandHandler";
import {startHandler} from "./handlers/startHandler";
import {message} from "telegraf/filters";
import {paymentHandler} from "./handlers/paymentHandler";
import {SOMETHING_WENT_WRONG} from "./text";

(async () => {

  process.title = 'Bot: telegraf'

  dotenv.config();

  log.init()

  await dataSource.initialize()

  const bot = new Telegraf(process.env.BOT_TOKEN);

  // делаем возможным отвечать на реплаи в группах
  bot.telegram.getMe().then((botInfo) => {
    // @ts-ignore
    bot.options.username = botInfo.username
  })

  //хэндлеры обработки сообщений и команд (основная логика)
  startHandler(bot)
  commandHandler(bot)
  messageHandler(bot)
  paymentHandler(bot)

  // запуск бота
  bot.launch()

  log.info('Bot started successfully!')

  // глобально ловим ошибки
  bot.catch((err, ctx) => {
    log.error(err);
    ctx.reply(SOMETHING_WENT_WRONG);
  });

  // гасим приложение культурно
  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.once(signal, () => {
      bot.stop(signal);
      log.info('STOP');
    });
  }

  // TODO: вынести в message handler
  bot.on('pre_checkout_query', (ctx) => {
    let data = ctx.update.pre_checkout_query

    console.log('data', data)

    ctx.answerPreCheckoutQuery(true)
        .then(() => {
          let message = 'Thanks for the purchase!'
          bot.telegram.sendMessage(data.from.id, message)
        })
  })






})();
