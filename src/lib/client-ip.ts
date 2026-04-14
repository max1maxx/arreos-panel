function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const v of values) {
    const s = typeof v === 'string' ? v.trim() : '';
    if (s) return s;
  }
  return null;
}

function stripPort(host: string): string {
  // IPv6 in brackets: [::1]:1234
  const bracketMatch = host.match(/^\[([^\]]+)\](?::\d+)?$/);
  if (bracketMatch?.[1]) return bracketMatch[1];

  // IPv4: 1.2.3.4:1234
  const parts = host.split(':');
  if (parts.length === 2 && /^\d+$/.test(parts[1] ?? '')) return parts[0] ?? host;

  return host;
}

function normalizeIp(raw: string): string | null {
  const value = raw.trim().replace(/^"+|"+$/g, '');
  if (!value) return null;

  // x-forwarded-for can be: "client, proxy1, proxy2"
  const first = value.split(',')[0]?.trim();
  if (!first) return null;

  // Forwarded header can embed: for=1.2.3.4;proto=https;by=...
  // We only normalize when the whole value is already a single token/IP.
  return stripPort(first);
}

function parseForwardedForIp(forwardedHeader: string): string | null {
  // RFC 7239: Forwarded: for=192.0.2.60;proto=http;by=203.0.113.43
  // Can repeat: Forwarded: for=1.2.3.4, for=5.6.7.8
  const firstPart = forwardedHeader.split(',')[0]?.trim();
  if (!firstPart) return null;

  const m = firstPart.match(/for=(?:"?\[?)([^\];",\s\]]+)(?:\]?"?)?/i);
  const ip = m?.[1]?.trim();
  if (!ip) return null;
  return stripPort(ip);
}

export function getClientIp(request: Request): string | null {
  // Prefer provider-specific headers first when present.
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  const trueClientIp = request.headers.get('true-client-ip'); // some CDNs
  const xRealIp = request.headers.get('x-real-ip'); // nginx
  const xClientIp = request.headers.get('x-client-ip');
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const forwarded = request.headers.get('forwarded'); // RFC 7239

  const forwardedIp = forwarded ? parseForwardedForIp(forwarded) : null;
  const headerCandidate = firstNonEmpty(
    cfConnectingIp,
    trueClientIp,
    xRealIp,
    xClientIp,
    xForwardedFor,
    forwardedIp
  );

  return headerCandidate ? normalizeIp(headerCandidate) : null;
}

export function getRateLimitKey(request: Request): string {
  const ip = getClientIp(request);
  if (ip) return `ip:${ip}`;

  // Sin proxy / sin cabeceras de IP: evita agrupar a TODOS en "unknown".
  // No es una identidad fuerte, pero es mejor que bloquear globalmente.
  const ua = request.headers.get('user-agent')?.trim();
  if (ua) return `ua:${ua}`;

  return 'unknown-client';
}
