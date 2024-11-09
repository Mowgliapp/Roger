let currentWallet = null;
let web3Modal;
let provider;

// Initialize Web3Modal with proper configuration
function init() {
    const providerOptions = {
        walletconnect: {
            package: WalletConnectProvider,
            options: {
                // Use Infura as provider
                rpc: {
                    1: "https://mainnet.infura.io/v3/YOUR_INFURA_ID", // Replace with your Infura ID
                    56: "https://bsc-dataseed.binance.org/",
                    137: "https://polygon-rpc.com/"
                }
            }
        }
    };

    web3Modal = new Web3Modal({
        network: "mainnet",
        cacheProvider: true,
        providerOptions,
        theme: "dark"
    });
}

// Connect wallet function
async function connectWallet(walletType) {
    try {
        switch (walletType) {
            case 'metamask':
                if (typeof window.ethereum !== 'undefined') {
                    provider = window.ethereum;
                    const web3 = new Web3(provider);
                    
                    const accounts = await provider.request({
                        method: 'eth_requestAccounts'
                    });
                    
                    if (accounts.length > 0) {
                        currentWallet = accounts[0];
                        
                        // Get network ID
                        const chainId = await web3.eth.getChainId();
                        console.log('Connected to chain:', chainId);
                        
                        setupEthereumListeners(provider);
                        updateWalletUI(currentWallet, 'metamask');
                        return true;
                    }
                } else {
                    window.open('https://metamask.io/download/', '_blank');
                }
                break;

            case 'walletconnect':
            case 'trustwallet':
                try {
                    provider = await web3Modal.connect();
                    const web3 = new Web3(provider);
                    const accounts = await web3.eth.getAccounts();
                    
                    if (accounts.length > 0) {
                        currentWallet = accounts[0];
                        setupEthereumListeners(provider);
                        updateWalletUI(currentWallet, walletType);
                        return true;
                    }
                } catch (error) {
                    console.error('WalletConnect error:', error);
                }
                break;
        }
    } catch (error) {
        console.error('Wallet connection error:', error);
        Telegram.WebApp.showPopup({
            title: 'Connection Failed',
            message: error.message || 'Could not connect to wallet. Please try again.',
            buttons: [{type: "ok"}]
        });
    }
    return false;
}

// Setup Ethereum event listeners
function setupEthereumListeners(provider) {
    if (provider.on) {
        provider.on("accountsChanged", handleAccountsChanged);
        provider.on("chainChanged", handleChainChanged);
        provider.on("disconnect", handleDisconnect);
    }
}

// Update UI after wallet connection
function updateWalletUI(address) {
    const walletIcon = document.querySelector('.wallet-icon');
    const walletButtons = document.querySelectorAll('.wallet-option');
    
    // Add coming soon tags to all wallet options
    walletButtons.forEach(button => {
        if (!button.querySelector('.coming-soon-tag')) {
            button.innerHTML = `
                <img src="./assets/images/${button.dataset.wallet}.png" alt="${button.dataset.wallet}">
                <span>${button.dataset.wallet.charAt(0).toUpperCase() + button.dataset.wallet.slice(1)}</span>
                <div class="coming-soon-tag">
                    <i class="fas fa-clock"></i>
                    <span>Soon</span>
                </div>
            `;
            button.disabled = true;
        }
    });

    // Reset wallet icon to default state
    walletIcon.innerHTML = '<i class="fas fa-wallet"></i>';
}

// Helper functions remain the same
function shortenAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        handleDisconnect();
    } else if (accounts[0] !== currentWallet) {
        currentWallet = accounts[0];
        updateWalletUI(currentWallet);
    }
}

function handleChainChanged() {
    window.location.reload();
}

function handleDisconnect() {
    currentWallet = null;
    if (provider?.disconnect) {
        provider.disconnect();
    }
    if (web3Modal) {
        web3Modal.clearCachedProvider();
    }
    updateWalletUI(null);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    init();

    const walletButtons = document.querySelectorAll('.wallet-option');
    walletButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            const walletType = button.dataset.wallet;
            if (!button.classList.contains('connected')) {
                await connectWallet(walletType);
            } else {
                handleDisconnect();
            }
        });
    });

    if (web3Modal.cachedProvider) {
        connectWallet(web3Modal.cachedProvider);
    }

    // Update UI to show all options as coming soon
    updateWalletUI();
});