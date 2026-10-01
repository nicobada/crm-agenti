const { execSync } = require('child_process');

const port = 3001;

try {
  const stdout = execSync(`netstat -ano | findstr :${port}`).toString();
  const lines = stdout.split('\n').filter(line => line.trim().length > 0);
  
  const pids = new Set();
  lines.forEach(line => {
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && !isNaN(pid) && pid !== '0') {
      pids.add(pid);
    }
  });

  pids.forEach(pid => {
    try {
      console.log(`Killing process ${pid} on port ${port}...`);
      execSync(`taskkill /F /PID ${pid}`);
    } catch (e) {
      // Ignore errors if process already dead
    }
  });
} catch (e) {
  // netstat returns exit code 1 if no matches found, which is fine
}

process.exit(0);
