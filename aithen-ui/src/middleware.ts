import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Get API base URL from environment or use default
// Note: In middleware, we need to use server-side env vars
function getApiUrl(): string {
  // Check for NEXT_PUBLIC_API_DEV or NEXT_PUBLIC_API_PROD (client-side accessible)
  const useProdApi = process.env.NEXT_PUBLIC_USE_PROD_API === 'true';
  
  if (useProdApi) {
    return process.env.NEXT_PUBLIC_API_PROD || 'https://your-production-api.com';
  }
  
  // Default to dev API (without /api suffix since we'll add it in the route)
  return process.env.NEXT_PUBLIC_API_DEV || 'http://localhost:8080';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only intercept /org/[company-name]/* routes
  const orgPathMatch = pathname.match(/^\/org\/([^/]+)/);
  if (!orgPathMatch) {
    return NextResponse.next();
  }

  const companySlug = orgPathMatch[1];

  // Skip validation for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  try {
    // Check if organization exists via public API
    const apiUrl = getApiUrl();
    // The API URL from config already includes /api, so we just need /orgs
    const orgCheckUrl = apiUrl.endsWith('/api') 
      ? `${apiUrl}/orgs/${encodeURIComponent(companySlug)}`
      : `${apiUrl}/api/orgs/${encodeURIComponent(companySlug)}`;
    
    const response = await fetch(orgCheckUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      // Organization not found or invalid
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 401 }
        );
      }
      // Other errors
      return NextResponse.json(
        { error: 'Failed to validate organization' },
        { status: 500 }
      );
    }

    // Organization exists - continue to the requested page
    return NextResponse.next();
  } catch (error) {
    // Network error or timeout
    console.error('Middleware error:', error);
    return NextResponse.json(
      { error: 'Failed to validate organization' },
      { status: 500 }
    );
  }
}

// Configure which routes this middleware should run on
export const config = {
  matcher: '/org/:path*',
};

