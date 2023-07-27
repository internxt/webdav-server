const TAG = 'VIRTUAL-FS';
export const logger = {
  info: (...message: any[]) => console.info(`[${TAG}]: `, ...message),
  error: (...message: any[]) => console.error(`[${TAG}]: `, ...message),
  warn: (...message: any[]) => console.warn(`[${TAG}]: `, ...message),
};
