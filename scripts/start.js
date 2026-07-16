const { spawn } = require('child_process');

console.log('Starting backend and frontend locally.');
const isWindows = process.platform === 'win32';
const npm = isWindows ? 'npm.cmd' : 'npm';
const shell = isWindows ? 'cmd.exe' : '/bin/sh';
const shellArgs = isWindows ? ['/d', '/s', '/c'] : ['-c'];

const backend = spawn(shell, [...shellArgs, `${npm} --workspace backend run dev`], { stdio: 'inherit', shell: false });
const frontend = spawn(shell, [...shellArgs, `${npm} --workspace frontend run dev`], { stdio: 'inherit', shell: false });

launchBrowserWhenReady();

backend.on('close', (code) => {
  if (code !== 0) {
    process.exit(code || 1);
  }
});

frontend.on('close', (code) => {
  if (code !== 0) {
    process.exit(code || 1);
  }
});

function launchBrowserWhenReady() {
  const urlsToTry = [
    'http://localhost:5173', // frontend dev
    'http://localhost:4000'  // backend
  ];

  const maxAttempts = 30;
  const intervalMs = 1000;
  let attempts = 0;

  const tryOpen = async () => {
    for (const u of urlsToTry) {
      const ok = await isUrlReachable(u, 1000);
      if (ok) {
        openUrl(u);
        return;
      }
    }
    attempts++;
    if (attempts >= maxAttempts) return;
    setTimeout(tryOpen, intervalMs);
  };

  tryOpen();
}

function isUrlReachable(urlStr, timeout = 1000) {
  return new Promise((resolve) => {
    try {
      const url = require('url');
      const parsed = new url.URL(urlStr);
      const lib = parsed.protocol === 'https:' ? require('https') : require('http');
      const req = lib.request({ method: 'HEAD', hostname: parsed.hostname, port: parsed.port, path: parsed.pathname, timeout }, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 500);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    } catch (e) { resolve(false); }
  });
}

function openUrl(url) {
  const cp = require('child_process');
  const plat = process.platform;
  let cmd, args;
  if (plat === 'win32') {
    cmd = 'cmd'; args = ['/c', 'start', '""', url];
  } else if (plat === 'darwin') {
    cmd = 'open'; args = [url];
  } else {
    cmd = 'xdg-open'; args = [url];
  }
  try { cp.spawn(cmd, args, { stdio: 'ignore', detached: true }).unref(); }
  catch (e) { /* ignore */ }
}
