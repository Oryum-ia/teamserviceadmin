import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/'];
  
  // Rutas protegidas y sus roles requeridos
  const protectedRoutes = {
    '/paneladmin': ['admin'],
    '/tecnico': ['tecnico'],
    '/tecnico/diagnostico': ['tecnico']
  };

  // Si es una ruta pública, permitir acceso
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Verificar si es una ruta protegida
  const isProtectedRoute = Object.keys(protectedRoutes).some(route => 
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // En el middleware no podemos acceder a localStorage directamente
    // Por eso redirigimos a login y dejamos que el componente maneje la autenticación
    const response = NextResponse.next();
    
    // Agregar headers para que el componente sepa que debe verificar autenticación
    response.headers.set('x-require-auth', 'true');
    
    // Determinar el rol requerido para esta ruta
    const requiredRole = Object.entries(protectedRoutes).find(([route]) => 
      pathname.startsWith(route)
    )?.[1][0];
    
    if (requiredRole) {
      response.headers.set('x-required-role', requiredRole);
    }
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - img (public images)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|img).*)',
  ],
};