import { ru } from "date-fns/locale";
import { format } from "date-fns";

export const formatDate = (
    date: Date | number,
    formatString = "dd/MM/yyyy",
    options = { locale: ru }
): string => format(date, formatString, options);

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));