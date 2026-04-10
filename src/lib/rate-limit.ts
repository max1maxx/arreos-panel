const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 5;

export function checkRateLimit(ip: string, maxRequests = MAX_REQUESTS_PER_WINDOW): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  // Limpieza ocasional para evitar fugas de memoria en el Map
  if (Math.random() < 0.1) {
    for (const [key, data] of rateLimitMap.entries()) {
      if (data.timestamp < windowStart) rateLimitMap.delete(key);
    }
  }

  const record = rateLimitMap.get(ip);
  if (record && record.timestamp > windowStart) {
    if (record.count >= maxRequests) {
      return false; // Rate limit excedido
    }
    record.count++;
  } else {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
  }

  return true;
}
