// Add these constants at the top
let lastAdTime = 0;
const adCooldown = 300000; // 5 minutes

// Add this function to handle Adgram ads
window.handleAdgramAd = async function() {
    const now = Date.now();
    const lastAdTime = parseInt(localStorage.getItem('lastAdTime') || '0');
    const adCooldown = 300000; // 5 minutes

    if (now - lastAdTime < adCooldown) {
        const remainingTime = Math.ceil((adCooldown - (now - lastAdTime)) / 1000);
        Telegram.WebApp.showPopup({
            title: 'Please Wait',
            message: `You can watch another ad in ${remainingTime} seconds`,
            buttons: [{type: "ok"}]
        });
        return;
    }

    try {
        // Initialize Adgram
        if (!window.sad) {
            console.error('Adgram SDK not loaded');
            return;
        }

        window.sad.init({
            onAdLoaded: () => {
                console.log('Ad loaded successfully');
            },
            onAdCompleted: async () => {
                localStorage.setItem('lastAdTime', Date.now().toString());
                await giveAdReward();
            },
            onAdError: (error) => {
                console.error('Ad error:', error);
                Telegram.WebApp.showPopup({
                    title: 'Error',
                    message: 'Failed to load ad. Please try again later.',
                    buttons: [{type: "ok"}]
                });
            }
        });

        // Show the ad
        window.sad.showAd();

    } catch (error) {
        console.error('Error showing ad:', error);
        Telegram.WebApp.showPopup({
            title: 'Error',
            message: 'Ad service is currently unavailable. Please try again later.',
            buttons: [{type: "ok"}]
        });
    }
};

// Add this function to handle rewards
async function giveAdReward() {
    const reward = 1000;
    const user = Telegram.WebApp.initDataUnsafe.user;
    
    try {
        if (!user?.username) {
            // Handle non-logged in users
            const currentPoints = parseInt(localStorage.getItem('coins')) || 0;
            const newPoints = currentPoints + reward;
            localStorage.setItem('coins', newPoints);
            document.getElementById('points').innerText = newPoints;
        } else {
            // Handle logged in users with Firebase
            const userRef = ref(db, `users/${user.username}`);
            const snapshot = await get(userRef);
            const currentCoins = snapshot.val()?.coins || 0;
            const newCoins = currentCoins + reward;

            await update(userRef, {
                coins: newCoins,
                lastUpdated: Date.now()
            });

            document.getElementById('points').innerText = newCoins;
            localStorage.setItem('coins', newCoins);
        }

        // Show success message
        Telegram.WebApp.showPopup({
            title: 'Reward Received!',
            message: `You earned ${reward} coins!`
        });

    } catch (error) {
        console.error('Error giving reward:', error);
        Telegram.WebApp.showPopup({
            title: 'Error',
            message: 'Failed to give reward. Please try again.',
            buttons: [{type: "ok"}]
        });
    }
}

// Add this function to handle the wallet popup
function showWalletPopup() {
    const popup = document.createElement('div');
    popup.className = 'wallet-popup';
    popup.innerHTML = `
        <div class="wallet-popup-content">
            <i class="fas fa-wallet"></i>
            <span>Connect Wallet Coming Soon!</span>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    // Add show class after a small delay for animation
    setTimeout(() => popup.classList.add('show'), 100);
    
    // Remove popup after animation
    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    }, 2000);
}

// Add click event listener to the wallet icon
document.addEventListener('DOMContentLoaded', () => {
    const walletIcon = document.querySelector('.login svg');
    if (walletIcon) {
        walletIcon.addEventListener('click', (e) => {
            e.preventDefault();
            showWalletPopup();
        });
    }
}); 