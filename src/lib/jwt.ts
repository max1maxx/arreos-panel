import { SignJWT, jwtVerify } from 'jose';

// Movemos la validación del secreto al momento de uso para evitar que rompa el build de Next.js
const getEncodedKey = () => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('FATAL ERROR: La variable de entorno JWT_SECRET no está definida.');
  }
  return new TextEncoder().encode(JWT_SECRET);
};

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export async function signToken(payload: TokenPayload): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  // 4. JWT extendido: 60 días para mejorar la experiencia de usuario (UX) estilo red social.
  const exp = iat + (60 * 60 * 24 * 60); // 60 days

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime(exp)
    .setIssuedAt(iat)
    .setNotBefore(iat)
    .sign(getEncodedKey());
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ['HS256'],
    });
    
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}
