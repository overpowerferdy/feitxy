// Copy tracked native sources into the generated Capacitor Android project.
// The generated android/ folder stays out of git; these files are the source of truth.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "native", "android");
const target = path.join(root, "android", "app", "src", "main", "java", "com", "feit", "app");

if (!fs.existsSync(source)) {
  console.error("Missing native/android sources");
  process.exit(1);
}
fs.mkdirSync(target, { recursive: true });
for (const file of fs.readdirSync(source).filter((name) => name.endsWith(".java"))) {
  fs.copyFileSync(path.join(source, file), path.join(target, file));
  console.log(`Copied native/android/${file}`);
}
