import { FIXED_WORK_HOUR, FIXED_WORK_MINUTE } from '../config/constants.mjs';

export function getFixedNow() {
  const date = new Date();
  date.setHours(FIXED_WORK_HOUR, FIXED_WORK_MINUTE, 0, 0);
  return date;
}

export function getCurrentMinutes(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return Number.NaN;
  }

  return (date.getHours() * 60) + date.getMinutes();
}

export function toMinutes(hhmm) {
  const [hours, minutes] = String(hhmm).split(':').map((value) => Number(value));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return Number.NaN;
  }

  return (hours * 60) + minutes;
}
