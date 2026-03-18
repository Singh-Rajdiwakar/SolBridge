import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const sourceDir = join(process.cwd(), "target", "idl");
const outputDir = join(process.cwd(), "app-idls");

if (!existsSync(sourceDir)) {
  console.error("No IDL output found at target/idl. Run `npm run anchor:build` first.");
  process.exit(1);
}

mkdirSync(outputDir, { recursive: true });

for (const file of readdirSync(sourceDir)) {
  if (file.endsWith(".json")) {
    cpSync(join(sourceDir, file), join(outputDir, file));
    console.log(`Copied ${file}`);
  }
}
