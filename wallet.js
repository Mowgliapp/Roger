import { handleWithdrawal, getUserData, onUserDataChange, getTransactions, onTransactionsChange } from '../../src/config/firebase.js';

class WalletManager {
    constructor() {
        this.user = Telegram.WebApp.initDataUnsafe.user;
        this.initialized = false;
        this.modal = document.getElementById('withdrawModal');
        this.withdrawBtn = document.getElementById('withdrawBtn');
        this.cancelBtn = document.getElementById('cancelWithdraw');
        this.withdrawForm = document.getElementById('withdraw-form');
        this.withdrawAmount = document.getElementById('withdraw-amount');
        this.COIN_TO_USDT_RATE = 0.0001;
        this.transactions = [];
        this.unsubscribeTransactions = null;
        this.initializeUI();
        this.initializeListeners();
        this.addAnimations();
    }

    async initialize() {
        try {
            if (!this.user?.username) {
                throw new Error('User not logged in');
            }

            await this.loadInitialData();
            this.setupEventListeners();
            this.setupRealtimeUpdates();
            
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize wallet:', error);
        }
    }

    async loadInitialData() {
        try {
            const [userData, transactions] = await Promise.all([
                getUserData(this.user.username),
                getTransactions(this.user.username)
            ]);

            if (userData) {
                this.updateBalanceDisplay(userData.coins || 0);
            }

            this.transactions = transactions;
            this.renderTransactionHistory();
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    setupRealtimeUpdates() {
        if (!this.user?.username) return;

        onUserDataChange(this.user.username, (data) => {
            if (data?.coins !== undefined) {
                this.updateBalanceDisplay(data.coins);
            }
        });

        this.unsubscribeTransactions = onTransactionsChange(
            this.user.username,
            (transactions) => {
                this.transactions = transactions;
                this.renderTransactionHistory();
            }
        );
    }

    renderTransactionHistory() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;

        historyList.innerHTML = '';

        if (!this.transactions.length) {
            historyList.innerHTML = `
                <div class="no-transactions">
                    No transactions yet
                </div>
            `;
            return;
        }

        this.transactions.forEach(transaction => {
            const transactionEl = document.createElement('div');
            transactionEl.className = 'transaction-item';
            
            const date = new Date(transaction.timestamp);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            transactionEl.innerHTML = `
                <div class="transaction-info">
                    <span>${transaction.type}</span>
                    <span class="transaction-date">${formattedDate}</span>
                </div>
                <div class="transaction-amount">-${transaction.amount} COINS</div>
                <span class="transaction-status status-${transaction.status}">${transaction.status}</span>
            `;

            historyList.appendChild(transactionEl);
        });
    }

    setupEventListeners() {
        // Open modal
        this.withdrawBtn.addEventListener('click', () => {
            this.modal.classList.add('active');
        });

        // Close modal
        this.cancelBtn.addEventListener('click', () => {
            this.modal.classList.remove('active');
            this.withdrawForm.reset();
        });

        // Handle withdrawal amount input for USDT preview
        this.withdrawAmount.addEventListener('input', (e) => {
            const coins = parseInt(e.target.value) || 0;
            const usdt = (coins * this.COIN_TO_USDT_RATE).toFixed(2);
            document.getElementById('previewUsdt').textContent = usdt;
        });

        // Handle form submission with updated minimum
        this.withdrawForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const amount = parseInt(this.withdrawAmount.value);

                if (!amount || amount < 500) {
                    alert('Minimum withdrawal amount is 500 COINS');
                    return;
                }

                const result = await handleWithdrawal(this.user.username, amount);
                
                if (result.success) {
                    this.updateBalanceDisplay(result.newBalance);
                    alert(`Withdrawal of ${amount} coins initiated!`);
                    this.modal.classList.remove('active');
                    this.withdrawForm.reset();
                }
            } catch (error) {
                alert(error.message || 'Failed to process withdrawal');
            }
        });
    }

    updateBalanceDisplay(balance) {
        const pointsElement = document.getElementById('points');
        const usdtElement = document.getElementById('usdtAmount');
        
        if (pointsElement) {
            pointsElement.textContent = balance;
            localStorage.setItem('coins', balance);
        }
        
        if (usdtElement) {
            const usdtValue = (balance * this.COIN_TO_USDT_RATE).toFixed(2);
            usdtElement.textContent = usdtValue;
        }
    }

    cleanup() {
        if (this.unsubscribeTransactions) {
            this.unsubscribeTransactions();
        }
    }

    initializeUI() {
        // Add loading states and animations
        const walletIcon = document.querySelector('.wallet-icon i');
        if (walletIcon) {
            walletIcon.classList.add('pulse-animation');
        }

        // Initialize coming soon badges
        const badges = document.querySelectorAll('.coming-soon-badge');
        badges.forEach(badge => {
            badge.style.animation = 'pulse 2s infinite';
        });
    }

    initializeListeners() {
        // Wallet button listeners
        const walletButtons = document.querySelectorAll('.wallet-btn');
        walletButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const walletType = button.classList.contains('metamask') ? 'MetaMask' : 'WalletConnect';
                this.handleWalletClick(walletType);
            });

            // Add hover effects
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
            });
        });

        // Feature item hover effects
        const featureItems = document.querySelectorAll('.feature-item');
        featureItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'translateY(-5px)';
            });

            item.addEventListener('mouseleave', () => {
                item.style.transform = 'translateY(0)';
            });
        });
    }

    handleWalletClick(walletType) {
        // Show coming soon notification
        this.showNotification(`${walletType} integration coming soon!`);
        
        // Add click effect
        const button = document.querySelector(`.${walletType.toLowerCase()}`);
        if (button) {
            button.classList.add('clicked');
            setTimeout(() => {
                button.classList.remove('clicked');
            }, 200);
        }
    }

    showNotification(message) {
        // Remove existing notification if any
        const existingNotification = document.querySelector('.wallet-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create and show new notification
        const notification = document.createElement('div');
        notification.className = 'wallet-notification';
        notification.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);

        // Add show class after a small delay for animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Remove notification after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    addAnimations() {
        // Add shimmer effect to buttons
        const addShimmer = (element) => {
            const shimmer = document.createElement('div');
            shimmer.className = 'shimmer';
            element.appendChild(shimmer);
        };

        document.querySelectorAll('.wallet-btn').forEach(addShimmer);
    }
}

// Initialize wallet manager
let walletManager;
document.addEventListener('DOMContentLoaded', async () => {
    walletManager = new WalletManager();
    await walletManager.initialize();
});

// Cleanup on page unload
window.addEventListener('unload', () => {
    if (walletManager) {
        walletManager.cleanup();
    }
});

// Add this new code for swap functionality
class SwapManager {
    constructor() {
        this.initializeSwap();
    }

    initializeSwap() {
        const swapDirection = document.getElementById('swapDirection');
        const fromToken = document.getElementById('fromToken');
        const toToken = document.getElementById('toToken');

        if (swapDirection) {
            swapDirection.addEventListener('click', () => {
                // Animate the arrow rotation
                const arrow = swapDirection.querySelector('i');
                arrow.style.transform = 'rotate(180deg)';
                
                // Swap token information
                const fromTokenInfo = fromToken.innerHTML;
                fromToken.innerHTML = toToken.innerHTML;
                toToken.innerHTML = fromTokenInfo;

                // Reset arrow rotation after animation
                setTimeout(() => {
                    arrow.style.transform = 'rotate(0deg)';
                }, 300);

                // Show coming soon notification
                this.showNotification('Swap functionality coming soon!');
            });
        }

        // Add hover effects
        [fromToken, toToken].forEach(token => {
            if (token) {
                token.addEventListener('mouseenter', () => {
                    this.showTooltip(token, 'Token selection coming soon');
                });

                token.addEventListener('mouseleave', () => {
                    this.hideTooltip();
                });
            }
        });
    }

    showTooltip(element, message) {
        const tooltip = document.createElement('div');
        tooltip.className = 'swap-tooltip';
        tooltip.textContent = message;
        
        const rect = element.getBoundingClientRect();
        tooltip.style.top = `${rect.bottom + 5}px`;
        tooltip.style.left = `${rect.left + (rect.width / 2)}px`;
        
        document.body.appendChild(tooltip);
        
        setTimeout(() => tooltip.classList.add('show'), 10);
    }

    hideTooltip() {
        const tooltip = document.querySelector('.swap-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'swap-notification';
        notification.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize swap functionality
document.addEventListener('DOMContentLoaded', () => {
    new SwapManager();
}); 