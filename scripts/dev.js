#!/usr/bin/env node

/**
 * PathFinder Multi-Service Development Launcher
 * 
 * Runs all microservices and the Next.js frontend concurrently with a single command:
 *   npm run dev
 * 
 * Flags:
 *   --backend-only   Run only the API Gateway and 6 backend microservices (ports 5000-5006)
 *   --no-frontend    Same as --backend-only
 *   --frontend-only  Run only the frontend (port 3000)
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const readline = require('readline');

// ANSI Color Codes
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

const COLORS = {
  GATEWAY: '\x1b[36m',     // Cyan
  AUTH: '\x1b[34m',        // Blue
  CAREER: '\x1b[35m',      // Magenta
  LEARNING: '\x1b[33m',    // Yellow
  OPPORTUNITY: '\x1b[32m', // Green
  RESUME: '\x1b[31m',      // Red
  PROGRESS: '\x1b[38;5;208m', // Orange
  FRONTEND: '\x1b[96m',    // Light Cyan
  SYSTEM: '\x1b[90m',      // Gray
};

const ALL_SERVICES = [
  { name: 'GATEWAY', dir: 'api-gateway', port: 5000, desc: 'API Gateway & Reverse Proxy' },
  { name: 'AUTH', dir: 'auth-service', port: 5001, desc: 'Authentication & Student Profiles' },
  { name: 'CAREER', dir: 'career-ai-service', port: 5002, desc: 'Career Recommendation & Skill Gap AI' },
  { name: 'LEARNING', dir: 'learning-service', port: 5003, desc: 'Personalized Roadmap & Milestone Engine' },
  { name: 'OPPORTUNITY', dir: 'opportunity-service', port: 5004, desc: 'Internships, Jobs & Applications' },
  { name: 'RESUME', dir: 'resume-service', port: 5005, desc: 'Resume ATS Scanner & XYZ Enhancer' },
  { name: 'PROGRESS', dir: 'progress-service', port: 5006, desc: 'Readiness Index, Goals & Badges' },
  { name: 'FRONTEND', dir: 'frontend', port: 3000, desc: 'Next.js 16 Web Dashboard UI' },
];

const args = process.argv.slice(2);
const isBackendOnly = args.includes('--backend-only') || args.includes('--no-frontend');
const isFrontendOnly = args.includes('--frontend-only');

const selectedServices = ALL_SERVICES.filter(service => {
  if (isFrontendOnly) return service.name === 'FRONTEND';
  if (isBackendOnly) return service.name !== 'FRONTEND';
  return true;
});

console.log(`\n${BOLD}${COLORS.GATEWAY}========================================================================${RESET}`);
console.log(`${BOLD}  🚀 PathFinder AI — Development Environment Launcher${RESET}`);
console.log(`${COLORS.GATEWAY}========================================================================${RESET}`);
console.log(`${DIM}Starting ${selectedServices.length} services concurrently with unified log streaming...${RESET}\n`);

// Display Summary Table
console.log(`${BOLD}Active Services:${RESET}`);
selectedServices.forEach(s => {
  const color = COLORS[s.name] || RESET;
  console.log(`  ${color}[${s.name.padEnd(11)}]${RESET} Port ${BOLD}${s.port}${RESET} → http://localhost:${s.port} (${s.desc})`);
});
console.log(`\n${DIM}Tip: Press ${BOLD}Ctrl + C${RESET}${DIM} at any time to gracefully terminate all services.${RESET}\n`);
console.log(`${COLORS.GATEWAY}------------------------------------------------------------------------${RESET}\n`);

const spawnedProcesses = [];

function killAllProcesses() {
  console.log(`\n${COLORS.SYSTEM}[SYSTEM] Shutting down all services cleanly...${RESET}`);
  spawnedProcesses.forEach(({ name, proc }) => {
    if (!proc || !proc.pid) return;
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
      } else {
        process.kill(-proc.pid, 'SIGKILL');
      }
    } catch {
      try {
        proc.kill('SIGKILL');
      } catch {}
    }
  });
  console.log(`${COLORS.SYSTEM}[SYSTEM] All services stopped. Goodbye! 👋${RESET}\n`);
  process.exit(0);
}

// Handle interruption signals
process.on('SIGINT', killAllProcesses);
process.on('SIGTERM', killAllProcesses);

const rootDir = path.resolve(__dirname, '..');

selectedServices.forEach(service => {
  const color = COLORS[service.name] || RESET;
  const serviceDir = path.join(rootDir, service.dir);
  const isWin = process.platform === 'win32';
  const npmCmd = isWin ? 'npm.cmd' : 'npm';

  const proc = spawn(npmCmd, ['run', 'dev'], {
    cwd: serviceDir,
    env: { ...process.env, FORCE_COLOR: '1' },
    shell: true,
  });

  spawnedProcesses.push({ name: service.name, proc });

  // Stream stdout with colored prefix
  const rlOut = readline.createInterface({ input: proc.stdout });
  rlOut.on('line', (line) => {
    // Suppress redundant empty lines
    if (!line.trim()) return;
    console.log(`${color}[${service.name.padEnd(11)}]${RESET} ${line}`);
  });

  // Stream stderr with colored prefix
  const rlErr = readline.createInterface({ input: proc.stderr });
  rlErr.on('line', (line) => {
    if (!line.trim()) return;
    console.error(`${color}[${service.name.padEnd(11)}]${RESET} ${line}`);
  });

  proc.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`${color}[${service.name.padEnd(11)}]${RESET} Process exited with code ${code}`);
    }
  });

  proc.on('error', (err) => {
    console.error(`${color}[${service.name.padEnd(11)}]${RESET} Failed to start: ${err.message}`);
  });
});
