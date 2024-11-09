class DailyRewardsSystem {
    constructor() {
        this.rewards = [
            { day: 1, coins: 1000, energy: 50, powerUps: { doubleCoins: 1 } },
            { day: 2, coins: 2000, energy: 60, powerUps: { autoClick: 1 } },
            { day: 3, coins: 3000, energy: 70, powerUps: { energyBoost: 1 } },
            { day: 4, coins: 4000, energy: 80, powerUps: { xpBoost: 1 } },
            { day: 5, coins: 5000, energy: 90, powerUps: { doubleCoins: 2 } },
            { day: 6, coins: 6000, energy: 100, powerUps: { autoClick: 2 } },
            { day: 7, coins: 10000, energy: 150, powerUps: { 
                doubleCoins: 2, 
                autoClick: 2, 
                energyBoost: 2, 
                xpBoost: 2 
            }}
        ];

        this.state = {
            lastClaimDate: localStorage.getItem('lastClaimDate'),
            currentStreak: parseInt(localStorage.getItem('currentStreak')) || 0,
            maxStreak: parseInt(localStorage.getItem('maxStreak')) || 0,
            claimedToday: false
        };

        this.initialize();
    }

    initialize() {
        this.checkStreak();
        this.updateUI();
        this.checkForReward();
    }

    checkStreak() {
        if (!this.state.lastClaimDate) return;

        const lastClaim = new Date(this.state.lastClaimDate);
        const today = new Date();
        const diffDays = Math.floor((today - lastClaim) / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
            // Streak broken
            this.state.currentStreak = 0;
            this.saveState();
        }
    }

    async claimDailyReward() {
        if (this.state.claimedToday) {
            notificationManager.showNotification(
                'Already Claimed',
                {
                    body: 'You have already claimed your daily reward today. Come back tomorrow!',
                    icon: 'assets/images/daily-reward.png'
                }
            );
            return false;
        }

        const today = new Date();
        const reward = this.rewards[this.state.currentStreak % 7];

        // Grant rewards
        await mowgliApp.updateCoins(reward.coins);
        mowgliApp.energy += reward.energy;
        localStorage.setItem('energy', mowgliApp.energy);

        // Grant power-ups
        for (const [powerUpId, quantity] of Object.entries(reward.powerUps)) {
            powerUpSystem.addToInventory(powerUpId, quantity);
        }

        // Update streak
        this.state.currentStreak++;
        this.state.maxStreak = Math.max(this.state.maxStreak, this.state.currentStreak);
        this.state.lastClaimDate = today.toISOString();
        this.state.claimedToday = true;

        // Save state
        this.saveState();

        // Play reward animation and sound
        this.showRewardAnimation(reward);
        soundManager.play('reward');

        // Show notification
        notificationManager.showNotification(
            'Daily Reward Claimed!',
            {
                body: `Day ${this.state.currentStreak}: You received ${reward.coins} coins and more!`,
                icon: 'assets/images/daily-reward.png'
            }
        );

        return true;
    }

    showRewardAnimation(reward) {
        const rewardOverlay = document.createElement('div');
        rewardOverlay.className = 'daily-reward-overlay';
        rewardOverlay.innerHTML = `
            <div class="daily-reward-content">
                <h2>Daily Reward!</h2>
                <div class="streak-counter">Day ${this.state.currentStreak}</div>
                <div class="rewards-list">
                    <div class="reward-item">
                        <img src="assets/images/coin.gif" alt="Coins">
                        <span>+${reward.coins}</span>
                    </div>
                    <div class="reward-item">
                        <img src="assets/images/energy.png" alt="Energy">
                        <span>+${reward.energy}</span>
                    </div>
                    ${Object.entries(reward.powerUps).map(([id, quantity]) => `
                        <div class="reward-item">
                            <img src="${powerUpSystem.powerUps[id].icon}" alt="${powerUpSystem.powerUps[id].name}">
                            <span>×${quantity}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="streak-bonus ${this.state.currentStreak >= 7 ? 'complete' : ''}">
                    ${this.state.currentStreak >= 7 ? 'Weekly Streak Complete!' : `${7 - (this.state.currentStreak % 7)} days until bonus reward!`}
                </div>
            </div>
        `;

        document.body.appendChild(rewardOverlay);
        setTimeout(() => rewardOverlay.remove(), 5000);
    }

    saveState() {
        localStorage.setItem('lastClaimDate', this.state.lastClaimDate);
        localStorage.setItem('currentStreak', this.state.currentStreak);
        localStorage.setItem('maxStreak', this.state.maxStreak);
    }

    checkForReward() {
        if (!this.state.lastClaimDate) {
            this.showRewardAvailable();
            return;
        }

        const lastClaim = new Date(this.state.lastClaimDate);
        const today = new Date();
        
        if (lastClaim.getDate() !== today.getDate() || 
            lastClaim.getMonth() !== today.getMonth() || 
            lastClaim.getFullYear() !== today.getFullYear()) {
            this.showRewardAvailable();
        }
    }

    showRewardAvailable() {
        const rewardButton = document.getElementById('claim-daily-reward');
        if (rewardButton) {
            rewardButton.classList.add('available');
            rewardButton.innerHTML = `
                <div class="pulse-animation"></div>
                <span>Claim Daily Reward!</span>
            `;
        }

        notificationManager.showNotification(
            'Daily Reward Available!',
            {
                body: 'Your daily reward is ready to claim!',
                icon: 'assets/images/daily-reward.png'
            }
        );
    }

    updateUI() {
        const rewardsContainer = document.getElementById('daily-rewards');
        if (!rewardsContainer) return;

        let html = `
            <div class="streak-info">
                <div class="current-streak">Current Streak: ${this.state.currentStreak} days</div>
                <div class="max-streak">Best Streak: ${this.state.maxStreak} days</div>
            </div>
            <div class="rewards-calendar">
        `;

        this.rewards.forEach((reward, index) => {
            const day = index + 1;
            const isClaimed = this.state.currentStreak > index;
            const isToday = this.state.currentStreak === index;
            
            html += `
                <div class="reward-day ${isClaimed ? 'claimed' : ''} ${isToday ? 'today' : ''}">
                    <div class="day-number">Day ${day}</div>
                    <div class="reward-preview">
                        <div class="reward-coins">${reward.coins} coins</div>
                        <div class="reward-energy">+${reward.energy} energy</div>
                        <div class="reward-powerups">
                            ${Object.entries(reward.powerUps).map(([id, quantity]) => `
                                <div class="powerup-preview" title="${powerUpSystem.powerUps[id].name} ×${quantity}">
                                    <img src="${powerUpSystem.powerUps[id].icon}" alt="${powerUpSystem.powerUps[id].name}">
                                    <span>×${quantity}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ${isClaimed ? '<div class="claimed-mark">✓</div>' : ''}
                </div>
            `;
        });

        html += `
            </div>
            <button id="claim-daily-reward" 
                    onclick="dailyRewardsSystem.claimDailyReward()"
                    ${this.state.claimedToday ? 'disabled' : ''}>
                ${this.state.claimedToday ? 'Come back tomorrow!' : 'Claim Reward'}
            </button>
        `;

        rewardsContainer.innerHTML = html;
    }
}

export const dailyRewardsSystem = new DailyRewardsSystem(); 