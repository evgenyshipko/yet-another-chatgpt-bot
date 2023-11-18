//@ts-nocheck
import {configure, getLogger} from 'log4js';

const getLocalLogger = (category, level) => {
  const logger = getLogger(category);
  logger.level = level;
  return logger;
};

const info = (message, ...args) =>
  getLocalLogger('Bot', 'info').info(message, ...args);

const error = (message, ...args) =>
  getLocalLogger('Bot', 'error').error(message, ...args);

const init = () => {
  configure({
    appenders: {
      to_file: { type: 'file', filename: process.env.LOG_PATH + '/bot.log' },
      to_console: { type: 'console' },
    },
    categories: {
      default: { appenders: ['to_file', 'to_console'], level: 'all' },
    },
  });
}

export const log = {
  error, info, init
}