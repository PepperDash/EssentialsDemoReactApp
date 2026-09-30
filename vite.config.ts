import react from '@vitejs/plugin-react-swc';
import { defineConfig, type Plugin } from 'vite';

const CLIENT_LOG_PATH = '/__client-log';

/**
 * Dev-server only: forwards the page's uncaught errors, rejections, and console.error calls to the
 * dev server's terminal, tagged with the sender's user agent. Touchpanels have no dev tools, so
 * without this a failure on the panel is just a blank screen. The injected script is plain ES5 so
 * it still runs on a browser too old to parse the app itself.
 */
function clientErrorReporter(): Plugin {
  return {
    name: 'client-error-reporter',
    apply: 'serve',
    configureServer(server) {
      // Touchpanel browsers have been seen reusing a stale cached _config.local.json (pointing at
      // an old apiPath) without asking the server again. Force no-store on the local config and
      // on page loads so edits always reach the panel.
      server.middlewares.use((req, res, next) => {
        const isLocalConfig = req.url?.includes('/_local-config/') ?? false;
        const isPage = req.headers.accept?.includes('text/html') ?? false;
        if (isLocalConfig || isPage) {
          const setHeader = res.setHeader.bind(res);
          res.setHeader = (name, value) =>
            setHeader(name, name.toLowerCase() === 'cache-control' ? 'no-store' : value);
          res.setHeader('Cache-Control', 'no-store');
        }
        next();
      });

      server.middlewares.use(CLIENT_LOG_PATH, (req, res) => {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          server.config.logger.error(`[client ${req.socket.remoteAddress}] ${body}\n  UA: ${req.headers['user-agent']}`);
          res.statusCode = 204;
          res.end();
        });
      });
    },
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          injectTo: 'head-prepend',
          children: `(function () {
  function send(message) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '${CLIENT_LOG_PATH}', true);
      xhr.setRequestHeader('Content-Type', 'text/plain');
      xhr.send(String(message));
    } catch (e) {}
  }
  send('page loaded: ' + location.href);

  // Connectivity probe against the configured processor API: a CORS XHR, a no-cors fetch (succeeds
  // whenever the host is reachable, whatever CORS says), and a WebSocket to the same host:port.
  function probe(apiPath) {
    var version = apiPath + '/version';
    var xhr = new XMLHttpRequest();
    xhr.onload = function () { send('probe XHR ' + version + ' -> ' + xhr.status); };
    xhr.onerror = function () { send('probe XHR ' + version + ' -> network error'); };
    xhr.open('GET', version, true);
    xhr.send();
    if (window.fetch) {
      fetch(version, { mode: 'no-cors', cache: 'no-store' }).then(
        function () { send('probe no-cors fetch ' + version + ' -> reachable'); },
        function (e) { send('probe no-cors fetch ' + version + ' -> failed: ' + e); }
      );
    }
    try {
      var wsUrl = apiPath.replace(/^http/, 'ws').replace(/\\/mc\\/api.*$/, '/');
      var ws = new WebSocket(wsUrl);
      ws.onopen = function () { send('probe WebSocket ' + wsUrl + ' -> opened'); ws.close(); };
      ws.onerror = function () { send('probe WebSocket ' + wsUrl + ' -> error'); };
    } catch (e) { send('probe WebSocket threw: ' + e); }
  }
  var configXhr = new XMLHttpRequest();
  configXhr.onload = function () {
    try {
      var apiPath = JSON.parse(configXhr.responseText).apiPath;
      send('probe config apiPath: ' + apiPath);
      probe(apiPath);
    } catch (e) { send('probe: bad config ' + e); }
  };
  configXhr.open('GET', '/mc/app/_local-config/_config.local.json', true);
  configXhr.send();
  window.addEventListener('error', function (e) {
    var source = e.filename || (e.target && (e.target.src || e.target.href)) || '';
    send('error: ' + (e.message || 'resource failed to load') + ' @ ' + source + ':' + (e.lineno || '') + ':' + (e.colno || '') + (e.error && e.error.stack ? '\\n' + e.error.stack : ''));
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    send('unhandled rejection: ' + (r && r.stack ? r.stack : r));
  });
  var originalError = console.error;
  console.error = function () {
    var parts = [];
    for (var i = 0; i < arguments.length; i++) {
      var a = arguments[i];
      var text = a && a.stack ? a.stack : typeof a === 'object' ? (function () { try { return JSON.stringify(a); } catch (x) { return String(a); } })() : String(a);
      // Axios errors: say which request failed - "Network Error" alone doesn't.
      if (a && a.config) text += '\\n  request: ' + (a.config.method || '').toUpperCase() + ' ' + (a.config.baseURL || '') + (a.config.url || '') + ' code=' + a.code + ' status=' + (a.response ? a.response.status : 'none');
      parts.push(text);
    }
    send('console.error: ' + parts.join(' '));
    return originalError.apply(console, arguments);
  };
})();`,
        },
      ];
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  // The app is always served from /mc/app/ on the processor. Emitting absolute asset URLs avoids a
  // race between Vite's preload scanner and the dynamic <base> tag in index.html, which otherwise
  // 404s bundle assets on nested routes and leaves the panel blank.
  base: '/mc/app/',
  plugins: [react(), clientErrorReporter()],
  build: {
    // Inline every SVG as a data URI, not just those under Vite's 4KB default. On the TSW-1070 the
    // SVGs above that limit (emitted as separate /mc/app/assets/*.svg files) never rendered, even
    // though the processor serves them correctly - while the inlined ones always did. Other asset
    // types keep the default behavior.
    assetsInlineLimit: (filePath) => (filePath.endsWith('.svg') ? true : undefined),
  },
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Bootstrap 5.3 still uses Sass APIs that modern Sass deprecates. Nothing to fix on our
        // side; silence the hundreds of warnings the import produces.
        api: 'modern-compiler',
        silenceDeprecations: ['import', 'color-functions', 'global-builtin', 'if-function'],
      },
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    open: true,
    // Listen on all interfaces, not just localhost, so a touchpanel pointed at this machine via
    // Mobile Control's `developmentServerAddress` can reach it.
    host: true,
  },
});
