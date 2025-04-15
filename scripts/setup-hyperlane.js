const fs = require("fs")
const { execSync } = require("child_process")

console.log("Setting up Hyperlane Bridge integration...")

// Install dependencies
console.log("Installing required dependencies...")
try {
  execSync("npm install @hyperlane-xyz/sdk ethers@5.7.2 --save", { stdio: "inherit" })
  console.log("Dependencies installed successfully!")
} catch (error) {
  console.error("Failed to install dependencies:", error.message)
  process.exit(1)
}

console.log("\nHyperlane Bridge setup complete!")
console.log("\nYou can now access the bridge at: http://localhost:3000/bridge")
console.log("\nMake sure to run your development server with:")
console.log("  npm run dev")
