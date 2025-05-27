import logger from '../config/logger.js';
import { v4 as uuidv4 } from 'uuid';

export const requestLogger = (req, res, next) => {
  req.requestId = uuidv4();
  req.startTime = Date.now();

  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - (req.startTime || 0);
    
    logger.info('HTTP Request', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
    });

    return originalSend.call(this, body);
  };

  next();
};