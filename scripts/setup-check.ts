import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

async function main() {
  const envPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath)) {
    console.log("Welcome to Next.js Ultimate SaaS!");
    console.log("No .env.local file found. Starting setup wizard...\n");
    
    try {
      execSync("npm run setup", { stdio: "inherit" });
    } catch (error) {
      console.error("Setup wizard failed or was cancelled.");
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

