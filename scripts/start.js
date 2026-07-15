const { spawnSync, spawn } = require('child_process');
const path = require('path');

function checkDockerCompose() {
  // Try `docker compose version` first
  try {
    const r = spawnSync('docker', ['compose', 'version'], { stdio: 'ignore' });
    if (r.status === 0) return { cmd: 'docker', args: ['compose', 'up', '--build'] };
  } catch (e) {}

  // Fallback to `docker-compose` if available
  try {
    const r2 = spawnSync('docker-compose', ['version'], { stdio: 'ignore' });
    if (r2.status === 0) return { cmd: 'docker-compose', args: ['up', '--build'] };
  } catch (e) {}

  return null;
}

const dockerCmd = checkDockerCompose();
if (dockerCmd) {
  console.log('Docker detected — starting services with Docker Compose.');
  // Try a synchronous up first so we can catch failures like name conflicts
  try {
    const sync = spawnSync(dockerCmd.cmd, dockerCmd.args, { stdio: 'inherit' });
    if (sync.status === 0) {
      // Containers started; attempt to open the app in the browser
      launchBrowserWhenReady();
      process.exit(0);
    }
    console.error('Docker Compose up failed with code', sync.status, '. Attempting `docker compose down` and retrying.');

    // run `down` to clear leftover containers
    const downArgs = dockerCmd.cmd === 'docker' ? ['compose', 'down'] : ['down'];
    spawnSync(dockerCmd.cmd, downArgs, { stdio: 'inherit' });

    // Re-run up in attached mode
    const p = spawn(dockerCmd.cmd, dockerCmd.args, { stdio: 'inherit' });
    // When running attached, start a background watcher to open the browser when services are ready
    launchBrowserWhenReady();
    p.on('close', (code) => process.exit(code));
  } catch (e) {
    console.error('Failed to run Docker Compose:', e);
    process.exit(1);
  }
} else {
  console.log('Docker Compose not found — starting backend and frontend locally.');
  // Run both backend and frontend concurrently using npm run dev
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const p = spawn(npm, ['run', 'dev'], { stdio: 'inherit' });
  // Start watcher to open browser when local services respond
  launchBrowserWhenReady();
  p.on('close', (code) => process.exit(code));
}

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
