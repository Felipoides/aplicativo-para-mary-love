// Keep Expo/Metro as the app runtime; adapt the managed preview's Vite-shaped flags.
const { spawn } = require('node:child_process');
const args = process.argv.slice(2);
const index = args.indexOf('--port');
const port = index < 0 ? '4173' : args[index + 1];
const child = spawn(process.execPath, [require.resolve('expo/bin/cli'), 'start', '--web', '--host', 'lan', '--port', port], {
  stdio: 'inherit', env: { ...process.env, CI: '1', EXPO_OFFLINE: '1' },
});
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
child.on('exit', code => process.exit(code ?? 1));
