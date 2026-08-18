const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("----------------------------------------------------");
  console.log("Credora v2 — Deploying CertificateRegistry Contract");
  console.log("Problem Statement: HV-CYB-03 | Team DeepThinkers");
  console.log("----------------------------------------------------");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const registry = await CertificateRegistry.deploy();
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  console.log(`CertificateRegistry deployed successfully to: ${contractAddress}`);

  // Save contract address and ABI to backend config
  const deploymentInfo = {
    contractAddress,
    network: hre.network.name,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, "../backend/src/config/contractAddress.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment info saved to: ${outputPath}`);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
