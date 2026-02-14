import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    // Get session
    const {
        data: { session },
    } = await supabase.auth.getSession();

    // Protected admin routes
    if (req.nextUrl.pathname.startsWith('/admin')) {
        // Allow access to login page
        if (req.nextUrl.pathname === '/admin' || req.nextUrl.pathname === '/admin/') {
            // If already logged in, redirect to dashboard
            if (session) {
                return NextResponse.redirect(new URL('/admin/dashboard', req.url));
            }
            return res;
        }

        // For all other admin routes, require authentication
        if (!session) {
            // Redirect to login with return URL
            const redirectUrl = new URL('/admin', req.url);
            redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
            return NextResponse.redirect(redirectUrl);
        }

        // Additional security: Check if user email is from authorized domain (optional)
        // Uncomment and modify if you want to restrict to specific email domains
        // const authorizedDomains = ['yourdomain.com'];
        // const userEmail = session.user.email || '';
        // const emailDomain = userEmail.split('@')[1];
        // if (!authorizedDomains.includes(emailDomain)) {
        //     return NextResponse.redirect(new URL('/admin', req.url));
        // }
    }

    return res;
}

// Specify which routes this middleware should run on
export const config = {
    matcher: [
        '/admin/:path*',
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
