import { SignJWT, jwtVerify } from 'jose';

function getSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(
  payload: { userId: string; role: string },
  secret: string,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .setIssuedAt()
    .sign(getSecret(secret));
}

export async function signRefreshToken(
  payload: { userId: string; tokenId: string },
  secret: string,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .setIssuedAt()
    .sign(getSecret(secret));
}

export async function verifyToken<T>(token: string, secret: string): Promise<T> {
  const { payload } = await jwtVerify(token, getSecret(secret));
  return payload as unknown as T;
}
