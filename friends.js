import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js";
import { getDatabase, ref, onValue, get, set, push, update } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js";

class FriendsManager {
    constructor() {
        this.referralLink = '';
        this.referrals = [];
        this.db = null;
        this.user = null;
        this.adCounter = 0;
        this.initialize();
        this.initializeInterstitial();
    }

    async initialize() {
        // Initialize Firebase
        const firebaseConfig = {
            apiKey: "AIzaSyDhXhdgccrG0fBfA4E7UEeRhjr4rxIq_oY",
            authDomain: "mowgli-refferal-data.firebaseapp.com",
            databaseURL: "https://mowgli-refferal-data-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "mowgli-refferal-data",
            storageBucket: "mowgli-refferal-data.appspot.com",
            messagingSenderId: "499110209498",
            appId: "1:499110209498:web:9ba00de1466e07882e3",
            measurementId: "G-L0RYHEJYXX"
        };

        const app = initializeApp(firebaseConfig);
        this.db = getDatabase(app);
        this.user = Telegram.WebApp.initDataUnsafe.user;

        if (this.user?.username) {
            this.referralLink = `https://t.me/Mowglicoin_bot?start=${this.user.username}`;
            this.updateReferralLinkUI();
            await this.setupUserInDatabase();
            this.loadReferrals();
            this.setupRealTimeUpdates();
        } else {
            this.showNotification('Please login with Telegram to use referral system', 'error');
        }

        this.setupEventListeners();
    }

    async setupUserInDatabase() {
        if (!this.user?.username) return;

        const userRef = ref(this.db, `users/${this.user.username}`);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) {
            await set(userRef, {
                username: this.user.username,
                coins: 0,
                lastUpdated: Date.now(),
                referrer: null
            });
        }
    }

    async addReferral(referredUsername) {
        if (!this.user?.username || !referredUsername) return;
        
        try {
            // Add to referrals collection
            const referralRef = ref(this.db, `referrals/${this.user.username}/${referredUsername}`);
            await set(referralRef, {
                username: referredUsername,
                joinedAt: Date.now(),
                rewarded: true
            });

            // Update referred user's referrer field
            const referredUserRef = ref(this.db, `users/${referredUsername}`);
            await update(referredUserRef, {
                referrer: this.user.username,
                lastUpdated: Date.now()
            });

            // Update referrer's coins
            const userRef = ref(this.db, `users/${this.user.username}`);
            const snapshot = await get(userRef);
            if (snapshot.exists()) {
                const currentCoins = snapshot.val().coins || 0;
                await set(userRef, {
                    ...snapshot.val(),
                    coins: currentCoins + 1000,
                    lastUpdated: Date.now()
                });
            }

            // Add transaction record
            const transactionRef = ref(this.db, `transactions/${this.user.username}`);
            await push(transactionRef, {
                type: 'referral_reward',
                amount: 1000,
                timestamp: Date.now(),
                referredUser: referredUsername
            });

            this.showNotification('Referral added successfully!', 'success');
            this.loadReferrals(); // Reload the referrals list

            this.adCounter++;
            if (this.adCounter >= 5) {
                this.showInterstitial();
                this.adCounter = 0;
            }

        } catch (error) {
            console.error('Error adding referral:', error);
            this.showNotification('Failed to add referral', 'error');
        }
    }

    updateReferralLinkUI() {
        const referralInput = document.getElementById('referralLink');
        if (referralInput) {
            referralInput.value = this.referralLink;
        }
    }

    setupEventListeners() {
        const copyButton = document.getElementById('copyButton');
        if (copyButton) {
            copyButton.addEventListener('click', () => this.copyReferralLink());
        }

        const telegramButton = document.querySelector('.share-btn.telegram');
        const twitterButton = document.querySelector('.share-btn.twitter');

        if (telegramButton) {
            telegramButton.addEventListener('click', () => this.shareOnTelegram());
        }

        if (twitterButton) {
            twitterButton.addEventListener('click', () => this.shareOnTwitter());
        }
    }

    async copyReferralLink() {
        try {
            await navigator.clipboard.writeText(this.referralLink);
            this.showNotification('Referral link copied to clipboard!', 'success');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            this.showNotification('Failed to copy link', 'error');
        }
    }

    shareOnTelegram() {
        const text = encodeURIComponent(`🎮 Join Mowgli and earn coins! Use my referral link:\n${this.referralLink}\n\n🎁 Get 1000 coins when you join!`);
        window.open(`https://t.me/share/url?url=${text}`);
    }

    shareOnTwitter() {
        const text = encodeURIComponent(`🎮 Join Mowgli and earn coins!\n\n🎁 Use my referral link to get 1000 coins:\n${this.referralLink}`);
        window.open(`https://twitter.com/intent/tweet?text=${text}`);
    }

    setupRealTimeUpdates() {
        if (!this.user?.username) return;

        const referralsRef = ref(this.db, `referrals/${this.user.username}`);
        onValue(referralsRef, (snapshot) => {
            this.loadReferrals();
        });
    }

    async loadReferrals() {
        if (!this.user?.username) return;

        const referralsList = document.getElementById('referralsList');
        if (!referralsList) return;

        try {
            // Get referrals from the referrals collection
            const referralsRef = ref(this.db, `referrals/${this.user.username}`);
            const snapshot = await get(referralsRef);
            
            // Get user data to check if they were referred
            const userRef = ref(this.db, `users/${this.user.username}`);
            const userSnapshot = await get(userRef);
            
            let referralsArray = [];
            
            // Add referrals where user is the referrer
            if (snapshot.exists()) {
                const referralsData = snapshot.val();
                referralsArray = Object.entries(referralsData).map(([username, data]) => ({
                    username,
                    ...data,
                    type: 'referred'
                }));
            }
            
            // Add user's own referrer if they were referred
            if (userSnapshot.exists() && userSnapshot.val().referrer) {
                referralsArray.unshift({
                    username: userSnapshot.val().referrer,
                    joinedAt: userSnapshot.val().lastUpdated,
                    type: 'referrer'
                });
            }
            
            if (referralsArray.length === 0) {
                referralsList.innerHTML = `
                    <div class="no-referrals">
                        <p>No referrals yet. Share your link to invite friends!</p>
                    </div>
                `;
                return;
            }

            // Sort referrals by date, newest first
            referralsArray.sort((a, b) => b.joinedAt - a.joinedAt);

            // Display referrals with different styles for referrer vs referred
            referralsList.innerHTML = referralsArray.map(referral => `
                <div class="referral-item ${referral.type}">
                    <div class="referral-info">
                        <div class="referral-username">
                            ${referral.type === 'referrer' ? 
                                `<span class="referrer-badge">Referrer</span>` : 
                                ''
                            }
                            @${referral.username}
                        </div>
                        <div class="referral-date">${this.formatDate(referral.joinedAt)}</div>
                    </div>
                    <div class="referral-reward">
                        ${referral.type === 'referred' ? `
                            <img src="./assets/images/coin.gif" alt="coins" width="20">
                            <span>+1000</span>
                        ` : ''}
                    </div>
                </div>
            `).join('');

            // Add CSS for the new styles
            this.addReferralStyles();

        } catch (error) {
            console.error('Error loading referrals:', error);
            this.showNotification('Failed to load referrals', 'error');
        }
    }

    addReferralStyles() {
        // Add these styles if they don't exist
        if (!document.getElementById('referral-styles')) {
            const styles = document.createElement('style');
            styles.id = 'referral-styles';
            styles.textContent = `
                .referral-item {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 15px;
                    margin-bottom: 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.3s ease;
                }

                .referral-item.referrer {
                    background: rgba(255, 215, 0, 0.05);
                    border: 1px solid rgba(255, 215, 0, 0.2);
                }

                .referrer-badge {
                    background: rgba(255, 215, 0, 0.2);
                    color: #FFD700;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.8em;
                    margin-right: 8px;
                }

                .referral-info {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .referral-username {
                    display: flex;
                    align-items: center;
                    font-weight: bold;
                }

                .referral-date {
                    font-size: 0.9em;
                    color: rgba(255, 255, 255, 0.6);
                }

                .referral-reward {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    color: #FFD700;
                }
            `;
            document.head.appendChild(styles);
        }
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    initializeInterstitial() {
        if (typeof google !== 'undefined') {
            this.interstitialAd = new google.ima.AdDisplayContainer(
                document.getElementById('interstitialContainer')
            );
        }
    }

    showInterstitial() {
        if (this.interstitialAd && this.interstitialAd.isLoaded()) {
            this.interstitialAd.show();
            this.interstitialAd.addEventListener('complete', () => {
                this.showNotification('Earned 1000 coins from video!');
            });
        }
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    new FriendsManager();
}); 