import { openContractCall } from '@stacks/connect';
import { StacksTestnet } from '@stacks/network';
import { stringUtf8CV, uintCV, boolCV } from '@stacks/transactions';

// Connect to the Stacks network
const network = new StacksTestnet();
const contractAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const contractName = 'governance';

// Function to submit a proposal
async function submitProposal(title, description) {
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
            console.log('Transaction finished:', result);
            fetchProposals(); // Refresh the proposal list
        },
    };

    try {
        await openContractCall(options);
    } catch (error) {
        console.error('Failed to submit proposal:', error);
    }
}

// Function to vote on a proposal
async function vote(proposalId, support) {
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
    }
}

// Function to fetch proposals
async function fetchProposals() {
    try {
        const response = await callReadOnlyFunction({
            contractAddress,
            contractName,
            functionName: 'get-all-proposals',
            network,
        });

        const proposals = cvToJSON(response).value;
        displayProposals(proposals);
    } catch (error) {
        console.error('Failed to fetch proposals:', error);
    }
}

// Function to display proposals
function displayProposals(proposals) {
    const proposalList = document.getElementById('proposalList');
    proposalList.innerHTML = '';

    proposals.forEach((proposal, index) => {
        const proposalElement = document.createElement('div');
        proposalElement.className = 'proposal';
        proposalElement.innerHTML = `
            <h3>${proposal.title}</h3>
            <p>${proposal.description}</p>
            <p>Votes: Yes - ${proposal.votesYes}, No - ${proposal.votesNo}</p>
            <div class="vote-buttons">
                <button onclick="vote(${index}, true)">Vote Yes</button>
                <button onclick="vote(${index}, false)">Vote No</button>
            </div>
        `;
        proposalList.appendChild(proposalElement);
    });
}

// Event listener for form submission
document.getElementById('proposalForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('proposalTitle').value;
    const description = document.getElementById('proposalDescription').value;
    await submitProposal(title, description);
    document.getElementById('proposalForm').reset();
});

// Fetch proposals on page load
fetchProposals();