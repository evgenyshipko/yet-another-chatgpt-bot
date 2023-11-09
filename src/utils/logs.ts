//@ts-nocheck
import { getLogger } from 'log4js';

const getLocalLogger = (category, level) => {
  const logger = getLogger(category);
  logger.level = level;
  return logger;
};

export const logBotInfo = (message, ...args) =>
  getLocalLogger('Bot', 'info').info(message, ...args);

export const logBotError = (message, ...args) =>
  getLocalLogger('Bot', 'error').error(message, ...args);

export const logButtonPush = (button, chatId, ...args) =>
  getLocalLogger(`Button ${button} pushed`, 'info').info(
    `chatId: ${chatId}`,
    ...args,
  );
