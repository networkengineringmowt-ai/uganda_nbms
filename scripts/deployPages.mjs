import { rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = path.resolve('.');
const dist = path.join(root, 'dist');

const run = (args, cwd = root, capture = false) => {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || `git ${args.join(' ')} failed`);
  }

  return capture ? result.stdout.trim() : '';
};

const remote = run(['config', '--get', 'remote.origin.url'], root, true);
await rm(path.join(dist, '.git'), { recursive: true, force: true });

run(['init', '--initial-branch=pages-build'], dist);
run(['config', 'user.name', 'Uganda BMS Pages'], dist);
run(['config', 'user.email', 'pages@uganda-bms.local'], dist);
run(['add', '.'], dist);
run(['commit', '-m', 'Deploy Uganda BMS operational workspace'], dist);
run(['remote', 'add', 'origin', remote], dist);
run(['push', '--force', 'origin', 'HEAD:gh-pages'], dist);

console.log('Published prepared production build to gh-pages.');
