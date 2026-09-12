const { spawn } = require("node:child_process");

const port = 5199;
const server = spawn(process.execPath, ["server.js"], {
  cwd: __dirname + "/..",
  env: {
    ...process.env,
    PORT: String(port),
    DB_URL: "",
    DB_SECRET: "",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
const timeout = setTimeout(() => {
  finish(new Error(`Timed out waiting for /health. Output:\n${output}`));
}, 8000);

server.stdout.on("data", (chunk) => {
  output += chunk.toString();
});

server.stderr.on("data", (chunk) => {
  output += chunk.toString();
});

server.on("error", finish);

async function waitForHealth() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      const body = await response.json();

      if (response.ok && body.status === "healthy" && body.persistence === "memory") {
        finish();
        return;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  finish(new Error(`Health check did not return memory mode. Output:\n${output}`));
}

function finish(error) {
  clearTimeout(timeout);
  server.kill("SIGTERM");

  if (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

waitForHealth();
