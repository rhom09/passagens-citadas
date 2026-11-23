import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Libera manifest e ícones para que a instalação do PWA não falhe nos navegadores
  // (engines de PWA no Chrome/Safari frequentemente fazem requisições anônimas aos metadados)
  if (
    pathname === '/manifest.json' ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/icon-')
  ) {
    return NextResponse.next();
  }

  const basicUser = process.env.BASIC_AUTH_USER;
  const basicPass = process.env.BASIC_AUTH_PASS;

  // Se não houver credenciais configuradas no ambiente, permite a requisição
  if (!basicUser || !basicPass) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get('authorization');

  if (authHeader && authHeader.startsWith('Basic ')) {
    const base64Credentials = authHeader.split(' ')[1];
    if (base64Credentials) {
      try {
        const decoded = atob(base64Credentials);
        const [user, ...passParts] = decoded.split(':');
        const pass = passParts.join(':');

        if (user === basicUser && pass === basicPass) {
          return NextResponse.next();
        }
      } catch {
        // Falha na decodificação base64: cai no 401 abaixo
      }
    }
  }

  return new NextResponse('Autenticação necessária', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Passagens Citadas"',
    },
  });
}

export const config = {
  /*
   * Intercepta todas as rotas e arquivos, exceto chunks internos do Next.js estáticos
   */
  matcher: ['/((?!_next/static|_next/image).*)'],
};
