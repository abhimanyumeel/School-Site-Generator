import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Get the token from the cookies
  const token = request.cookies.get('token')?.value;

  // Define public paths that don't require authentication
  const isPublicPath = path === '/login' || path === '/register';

  // If trying to access a public path with a token, redirect to appropriate dashboard
  if (isPublicPath && token) {
    // Try to parse the token to get the role (you might need to adjust this based on your token structure)
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      if (tokenData.role === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/super-admin/dashboard', request.url));
      } else {
        return NextResponse.redirect(new URL('/home', request.url));
      }
    } catch (error) {
      // If token parsing fails, continue with the request
      console.error('Error parsing token:', error);
    }
  }

  // If trying to access a protected path without a token, redirect to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If trying to access super-admin routes, check role
  if (path.startsWith('/super-admin')) {
    try {
      const tokenData = JSON.parse(atob(token!.split('.')[1]));
      if (tokenData.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/home', request.url));
      }
    } catch (error) {
      console.error('Error parsing token:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // If trying to access regular user routes (/home), prevent super admin access
  if (path === '/home') {
    try {
      const tokenData = JSON.parse(atob(token!.split('.')[1]));
      if (tokenData.role === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/super-admin/dashboard', request.url));
      }
    } catch (error) {
      console.error('Error parsing token:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Continue with the request if all checks pass
  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
