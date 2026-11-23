import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';

describe('Basic Auth Middleware', () => {
  const originalUser = process.env.BASIC_AUTH_USER;
  const originalPass = process.env.BASIC_AUTH_PASS;

  beforeEach(() => {
    process.env.BASIC_AUTH_USER = 'operador';
    process.env.BASIC_AUTH_PASS = 'senha123';
  });

  afterEach(() => {
    process.env.BASIC_AUTH_USER = originalUser;
    process.env.BASIC_AUTH_PASS = originalPass;
  });

  it('permite acesso livre a /manifest.json sem autenticacao', () => {
    const req = new NextRequest('http://localhost:3000/manifest.json');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('permite acesso livre a icones do PWA sem autenticacao', () => {
    const req = new NextRequest('http://localhost:3000/icon-192.png');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('bloqueia rota raiz / sem cabecalho de autenticacao retornando 401', () => {
    const req = new NextRequest('http://localhost:3000/');
    const res = middleware(req);
    expect(res.status).toBe(401);
    expect(res.headers.get('WWW-Authenticate')).toContain('Basic realm=');
  });

  it('bloqueia /data/arc.v1.json sem autenticacao', () => {
    const req = new NextRequest('http://localhost:3000/data/arc.v1.json');
    const res = middleware(req);
    expect(res.status).toBe(401);
  });

  it('bloqueia credenciais incorretas', () => {
    const req = new NextRequest('http://localhost:3000/', {
      headers: {
        authorization: 'Basic ' + Buffer.from('operador:errada').toString('base64'),
      },
    });
    const res = middleware(req);
    expect(res.status).toBe(401);
  });

  it('autoriza credenciais validas', () => {
    const req = new NextRequest('http://localhost:3000/', {
      headers: {
        authorization: 'Basic ' + Buffer.from('operador:senha123').toString('base64'),
      },
    });
    const res = middleware(req);
    expect(res.status).toBe(200);
  });
});
