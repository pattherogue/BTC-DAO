import { AppConfig, UserSession, showConnect } from '@stacks/connect';
import { StacksTestnet } from '@stacks/network';
import { stringUtf8CV, uintCV, boolCV, callReadOnlyFunction } from '@stacks/transactions';
import { openContractCall } from '@stacks/connect';

console.log('app.js loaded');

// Initialize Stacks session
const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

// Connect to the Stacks network
const network = new StacksTestnet({ url: 'https://stacks-node-api.testnet.stacks.co' });
const contractAddress = 'STBESZX4X';
const contractName = 'governance';

// Function to authenticate user
function authenticateUser() {
    console.log('authenticateUser function called');
    showConnect({
        appDetails: {
            name: 'Bitcoin DAO MVP',
            icon: window.location.origin + '/favicon.ico',
        },
        redirectTo: '/',
        onFinish: () => {
            console.log('Authentication finished');
            updateUI();
        },
        userSession: userSession,
    });
}

// Function to update UI based on authentication state
function updateUI() {
    console.log('updateUI function called');
    const connectWalletBtn = document.getElementById('connectWallet');
    if (userSession.isUserSignedIn()) {
        console.log('User is signed in');
        connectWalletBtn.textContent = 'Wallet Connected';
        connectWalletBtn.disabled = true;
        fetchProposals();
    } else {
        console.log('User is not signed in');
        connectWalletBtn.textContent = 'Connect Wallet';
        connectWalletBtn.disabled = false;
        document.getElementById('proposalList').innerHTML = '<p>Please connect your wallet to view proposals.</p>';
    }
}

// Function to submit a proposal
async function submitProposal(title, description) {
    console.log('submitProposal function called', { title, description });
    if (!userSession.isUserSignedIn()) {
        alert('Please connect your wallet first');
        return;
    }
    const functionArgs = [
        stringUtf8CV(title),
        stringUtf8CV(description)
    ];

    const options = {
        contractAddress,
        contractName,
        functionName: 'submit-proposal',
        functionArgs,
        network,
        onFinish: (result) => {
            console.log('Proposal submission finished:', result);
            fetchProposals(); // Refresh the proposal list
        },
    };

    try {
        await openContractCall(options);
    } catch (error) {
        console.error('Failed to submit proposal:', error);
        alert('Failed to submit proposal. Please try again.');
    }
}

// Function to vote on a proposal
async function vote(proposalId, support) {
    console.log('vote function called', { proposalId, support });
    if (!userSession.isUserSignedIn()) {
        alert('Please connect your wallet first');
        return;
    }
    const functionArgs = [
        uintCV(proposalId),
        boolCV(support)
    ];

    const options = {
        contractAddress,
        contractName,
        functionName: 'vote',
        functionArgs,
        network,
        onFinish: (result) => {
            console.log('Vote transaction finished:', result);
            fetchProposals(); // Refresh the proposal list
        },
    };

    try {
        await openContractCall(options);
    } catch (error) {
        console.error('Failed to vote:', error);
        alert('Failed to vote. Please try again.');
    }
}

// Function to fetch proposals
async function fetchProposals() {
    console.log('fetchProposals function called');
    try {
        const response = await callReadOnlyFunction({
            contractAddress,
            contractName,
            functionName: 'get-all-proposals',
            network,
        });

        console.log('Fetched proposals:', response);
        const proposals = response.value.value;
        displayProposals(proposals);
    } catch (error) {
        console.error('Failed to fetch proposals:', error);
        document.getElementById('proposalList').innerHTML = '<p>Failed to load proposals. Please try again later.</p>';
    }
}

// Function to display proposals
function displayProposals(proposals) {
    console.log('displayProposals function called', proposals);
    const proposalList = document.getElementById('proposalList');
    proposalList.innerHTML = '';

    proposals.forEach((proposal, index) => {
        const proposalElement = document.createElement('div');
        proposalElement.className = 'proposal';
        proposalElement.innerHTML = `
            <h3>${proposal.value.title.value}</h3>
            <p>${proposal.value.description.value}</p>
            <p>Votes: Yes - ${proposal.value.votesYes.value}, No - ${proposal.value.votesNo.value}</p>
            <div class="vote-buttons">
                <button onclick="window.vote(${index}, true)">Vote Yes</button>
                <button onclick="window.vote(${index}, false)">Vote No</button>
            </div>
        `;
        proposalList.appendChild(proposalElement);
    });
}

// Event listener for form submission
document.getElementById('proposalForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Proposal form submitted');
    const title = document.getElementById('proposalTitle').value;
    const description = document.getElementById('proposalDescription').value;
    await submitProposal(title, description);
    document.getElementById('proposalForm').reset();
});

// Event listener for connect wallet button
document.getElementById('connectWallet').addEventListener('click', () => {
    console.log('Connect Wallet button clicked');
    authenticateUser();
});

// Initialize the app
window.onload = () => {
    console.log('Window loaded');
    updateUI();
}

// Make functions available globally for button onclick
window.vote = vote;
window.authenticateUser = authenticateUser;