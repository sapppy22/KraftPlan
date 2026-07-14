import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../lib/jwt.js';

interface JwtPayload {
  userId: string;
  role: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export async function verifyJwt(
  request: FastifyRequest,
  reply: FastifyReply,
  jwtSecret: string,
): Promise<JwtPayload | null> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Missing authorization header' });
    return null;
  }

  try {
    const token = authHeader.slice(7);
    const payload = await verifyToken<JwtPayload>(token, jwtSecret);
    request.user = payload;
    return payload;
  } catch {
    reply.status(401).send({ error: 'Invalid or expired token' });
    return null;
  }
}
