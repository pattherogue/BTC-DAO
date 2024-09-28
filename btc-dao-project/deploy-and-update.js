import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to extract contract address from deployment plan
async function getContractAddress() {
    try {
        const planPath = path.join(__dirname, 'deployments', 'default.testnet-plan.yaml');
        const planContent = await fs.readFile(planPath, 'utf8');
        const plan = yaml.load(planContent);

        const contractPublish = plan.plan.batches[0].transactions.find(t => t['contract-publish']);
        if (!contractPublish) {
            throw new Error('Contract publish transaction not found in deployment plan');
        }

        const contractAddress = contractPublish['contract-publish'].expected_sender;
        const contractName = contractPublish['contract-publish'].contract_name;

        return `${contractAddress}.${contractName}`;
    } catch (error) {
        console.error('Error reading deployment plan:', error.message);
        process.exit(1);
    }
}

// Function to update app.js with new contract address
async function updateAppJs(contractAddress) {
    const appJsPath = path.join(__dirname, '..', 'app.js');
    let content = await fs.readFile(appJsPath, 'utf-8');
    
    // Update contract address
    content = content.replace(
        /const contractAddress = ['"]ST[A-Z0-9]+\.[\w]+['"];/,
        `const contractAddress = '${contractAddress}';`
    );
    
    // Update network to use actual testnet
    content = content.replace(
        /const network = new StacksTestnet\(\);/,
        `const network = new StacksTestnet({ url: 'https://stacks-node-api.testnet.stacks.co' });`
    );
    
    await fs.writeFile(appJsPath, content);
    console.log('app.js updated successfully');
}

// Main execution
async function main() {
    const contractAddress = await getContractAddress();
    console.log('Contract address:', contractAddress);
    await updateAppJs(contractAddress);
    console.log('Update complete');
}

main().catch(error => {
    console.error('An error occurred:', error);
    process.exit(1);
});