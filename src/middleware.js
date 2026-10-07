import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Get token from cookie
  const token = request.cookies.get('token')?.value;

  // Paths requiring authentication
  const isProtectedPath = pathname.startsWith('/shop') || pathname.startsWith('/admin');
  
  // Path for authentication page
  const isAuthPath = pathname.startsWith('/login');

  if (isProtectedPath && !token) {
    // Redirect to login page if trying to access protected content without token
    const loginUrl = new URL('/login', request.url);
    // Remember where they were going
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath && token) {
    // Redirect logged-in users away from login page to the shop
    return NextResponse.redirect(new URL('/shop', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run middleware on these paths
  matcher: ['/shop/:path*', '/admin/:path*', '/login'],
};
