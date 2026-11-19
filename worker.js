/**
 * Cloudflare Worker entrypoint for Cybex Precision Gunworx (Headless WooCommerce).
 *
 * - 301 www.cybexprecisiongunworx.com to the same path on the apex host
 * - 301 the old Bronze Meridian slug to the corrected ready-to-ship URL
 * - Proxies `/api/wc/store/*` to `${WC_BACKEND_URL}/wp-json/wc/store/v1/*`
 * - Serves all other requests from Cloudflare Workers Static Assets (`env.ASSETS`).
 */

const APEX_HOST = 'cybexprecisiongunworx.com';

/** Paths the storefront used before the bronxe-meridian slug was corrected. */
const LEGACY_PATHS = {
  '/ready-to-ship/bronxe-meridian-6-5cm': '/ready-to-ship/bronze-meridian-6-5cm/',
  '/shop/bronxe-meridian': '/ready-to-ship/bronze-meridian-6-5cm/',
  '/shop/bronxe-meridian-6-5cm': '/ready-to-ship/bronze-meridian-6-5cm/',
};

function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname;
}

/**
 * Return an absolute URL to 301 to, or null to continue.
 * www is matched on the full hostname so shop.* and *.workers.dev are left alone.
 * A www request for an old product path is sent to the apex URL in one hop.
 */
function resolveRedirect(url) {
  const target = new URL(url.href);
  let changed = false;

  if (target.hostname === `www.${APEX_HOST}`) {
    target.protocol = 'https:';
    target.hostname = APEX_HOST;
    changed = true;
  }

  const destPath = LEGACY_PATHS[normalizePath(target.pathname)];
  if (destPath) {
    const rewritten = new URL(destPath, target.origin);
    rewritten.search = target.search;
    return rewritten.toString();
  }

  return changed ? target.toString() : null;
}

function redirectResponse(location) {
  return new Response(null, {
    status: 301,
    headers: {
      Location: location,
      'Cache-Control': 'public, max-age=300',
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const redirectTo = resolveRedirect(url);
    if (redirectTo) return redirectResponse(redirectTo);

    const backendOrigin = (env.WC_BACKEND_URL || 'https://cybexprecisiongunworx.com').replace(/\/+$/, '');

    if (
      url.pathname.startsWith('/wp-content/') ||
      url.pathname.startsWith('/wp-json/') ||
      url.pathname.startsWith('/wp-admin') ||
      url.pathname.startsWith('/wp-includes/') ||
      url.pathname === '/wp-login.php'
    ) {
      return fetch(new Request(`${backendOrigin}${url.pathname}${url.search}`, request));
    }

    if (url.pathname.startsWith('/api/wc/')) {
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': url.origin,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Cart-Token, Nonce, X-WC-Store-API-Nonce',
            'Access-Control-Expose-Headers': 'Cart-Token, Nonce, X-WC-Store-API-Nonce, Cart-Hash',
          },
        });
      }

      let targetUrl;
      if (url.pathname.startsWith('/api/wc/store/')) {
        const subPath = url.pathname.slice('/api/wc/store/'.length);
        targetUrl = `${backendOrigin}/wp-json/wc/store/v1/${subPath}${url.search}`;
      } else {
        return new Response(JSON.stringify({ message: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const forwardHeaders = new Headers();
      const contentType = request.headers.get('Content-Type');
      if (contentType) forwardHeaders.set('Content-Type', contentType);

      const cartToken = request.headers.get('Cart-Token');
      if (cartToken) forwardHeaders.set('Cart-Token', cartToken);

      const nonce = request.headers.get('Nonce') || request.headers.get('X-WC-Store-API-Nonce');
      if (nonce) forwardHeaders.set('Nonce', nonce);

      forwardHeaders.set('User-Agent', 'CybexHeadlessStorefront/1.0');
      forwardHeaders.set('Accept', 'application/json');
      forwardHeaders.set('Cache-Control', 'no-cache, no-store');

      const init = {
        method: request.method,
        headers: forwardHeaders,
        cf: { cacheTtl: 0, cacheEverything: false },
      };

      if (request.method !== 'GET' && request.method !== 'HEAD') {
        init.body = await request.arrayBuffer();
      }

      const upstream = await fetch(targetUrl, init);
      const responseHeaders = new Headers();
      responseHeaders.set('Content-Type', upstream.headers.get('Content-Type') || 'application/json; charset=UTF-8');
      responseHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate');

      const upstreamCartToken = upstream.headers.get('Cart-Token') || upstream.headers.get('cart-token');
      if (upstreamCartToken) responseHeaders.set('Cart-Token', upstreamCartToken);

      const upstreamNonce = upstream.headers.get('Nonce') || upstream.headers.get('nonce');
      if (upstreamNonce) responseHeaders.set('Nonce', upstreamNonce);

      const upstreamCartHash = upstream.headers.get('Cart-Hash') || upstream.headers.get('cart-hash');
      if (upstreamCartHash) responseHeaders.set('Cart-Hash', upstreamCartHash);

      responseHeaders.set('Access-Control-Expose-Headers', 'Cart-Token, Nonce, Cart-Hash');

      return new Response(upstream.body, {
        status: upstream.status,
        headers: responseHeaders,
      });
    }

    const assetResponse = await env.ASSETS.fetch(request);
    const contentType = assetResponse.headers.get('Content-Type') || '';

    if (
      url.origin !== 'https://cybexprecisiongunworx.com' &&
      contentType.includes('text/html') &&
      typeof HTMLRewriter !== 'undefined'
    ) {
      const rewriter = new HTMLRewriter().on(
        'meta[property="og:image"], meta[property="og:image:secure_url"], meta[property="og:url"], meta[name="twitter:image"]',
        {
          element(el) {
            const content = el.getAttribute('content');
            if (content && content.startsWith('https://cybexprecisiongunworx.com')) {
              el.setAttribute(
                'content',
                content.replace('https://cybexprecisiongunworx.com', url.origin)
              );
            }
          },
        }
      );
      return rewriter.transform(assetResponse);
    }

    return assetResponse;
  },
};

