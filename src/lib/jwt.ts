import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;

// 1. Secreto JWT sin fallback: forzamos que se configure en el entorno (especialmente en producción)
if (!JWT_SECRET) {
  throw new Error('FATAL ERROR: La variable de entorno JWT_SECRET no está definida.');
}

const encodedKey = new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export async function signToken(payload: TokenPayload): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  // 4. JWT más corto: 1 día en lugar de 7 días para limitar la ventana de exposición.
  const exp = iat + 60 * 60 * 24; // 1 day

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime(exp)
    .setIssuedAt(iat)
    .setNotBefore(iat)
    .sign(encodedKey);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    });
    
    return payload as unknown as TokenPayload;
  } catch (error) {
    return null;
  }
}
