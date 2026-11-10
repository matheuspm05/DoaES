import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = new URL("../", import.meta.url);
const jobs = [
  ["backend", "src/server.js"],
  ["frontend", "node_modules/vite/bin/vite.js"],
];
const children = jobs.map(([folder, script]) =>
  spawn(process.execPath, [script], {
    cwd: fileURLToPath(new URL(folder + "/", root)),
    stdio: "inherit",
    windowsHide: true,
  }),
);
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  children.forEach((child) => child.kill());
  process.exitCode = code;
}
children.forEach((child) => {
  child.on("error", (e) => {
    console.error(e.message);
    stop(1);
  });
  child.on("exit", (code) => {
    if (!stopping) stop(code ?? 1);
  });
});
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
