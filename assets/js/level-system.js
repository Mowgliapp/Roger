class LevelSystem {
    constructor() {
        this.currentLevel = parseInt(localStorage.getItem('level')) || 1;
        this.currentXP = parseInt(localStorage.getItem('xp')) || 0;
        this.levelData = {
            multiplier: 1.5,
            baseXP: 100,
            rewards: {
                coins: 1000,
                energy: 20,
                powerups: 1
            }
        };
        this.initialize();
    }

    initialize() {
        this.updateUI();
        this.attachEventListeners();
    }

    getRequiredXP(level) {
        return Math.floor(this.levelData.baseXP * Math.pow(this.levelData.multiplier, level - 1));
    }

    getCurrentProgress() {
        const requiredXP = this.getRequiredXP(this.currentLevel);
        return (this.currentXP / requiredXP) * 100;
    }

    addXP(amount) {
        this.currentXP += amount;
        
        while (this.currentXP >= this.getRequiredXP(this.currentLevel)) {
            this.currentXP -= this.getRequiredXP(this.currentLevel);
            this.levelUp();
        }

        localStorage.setItem('xp', this.currentXP);
        this.updateUI();
    }

    levelUp() {
        this.currentLevel++;
        localStorage.setItem('level', this.currentLevel);
        
        // Grant level up rewards
        const rewards = this.calculateLevelRewards();
        this.grantRewards(rewards);
        
        // Play level up animation and sound
        soundManager.play('levelUp');
        this.showLevelUpAnimation();
        
        // Show notification
        notificationManager.showNotification(
            'Level Up!',
            {
                body: `Congratulations! You've reached level ${this.currentLevel}!`,
                icon: 'assets/images/level-up.png'
            }
        );
    }

    calculateLevelRewards() {
        return {
            coins: this.levelData.rewards.coins * this.currentLevel,
            energy: this.levelData.rewards.energy,
            powerups: this.levelData.rewards.powerups
        };
    }

    grantRewards(rewards) {
        mowgliApp.updateCoins(rewards.coins);
        mowgliApp.energy += rewards.energy;
        powerUpManager.addPowerUp('random', rewards.powerups);
    }

    showLevelUpAnimation() {
        const levelUpOverlay = document.createElement('div');
        levelUpOverlay.className = 'level-up-overlay';
        levelUpOverlay.innerHTML = `
            <div class="level-up-content">
                <h2>Level Up!</h2>
                <div class="level-number">${this.currentLevel}</div>
                <div class="rewards-list">
                    <div class="reward-item">
                        <img src="assets/images/coin.gif" alt="Coins">
                        <span>+${this.levelData.rewards.coins * this.currentLevel}</span>
                    </div>
                    <div class="reward-item">
                        <img src="assets/images/energy.png" alt="Energy">
                        <span>+${this.levelData.rewards.energy}</span>
                    </div>
                    <div class="reward-item">
                        <img src="assets/images/powerup.png" alt="Power-ups">
                        <span>+${this.levelData.rewards.powerups}</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(levelUpOverlay);
        setTimeout(() => levelUpOverlay.remove(), 3000);
    }

    updateUI() {
        const levelDisplay = document.getElementById('level-display');
        const xpProgress = document.getElementById('xp-progress');
        const xpText = document.getElementById('xp-text');

        if (levelDisplay) {
            levelDisplay.textContent = this.currentLevel;
        }

        if (xpProgress) {
            xpProgress.style.width = `${this.getCurrentProgress()}%`;
        }

        if (xpText) {
            const requiredXP = this.getRequiredXP(this.currentLevel);
            xpText.textContent = `${this.currentXP}/${requiredXP} XP`;
        }
    }

    attachEventListeners() {
        // Add XP when clicking the main coin
        const coinElement = document.getElementById('coin');
        if (coinElement) {
            coinElement.addEventListener('click', () => {
                this.addXP(1);
            });
        }
    }
}

export const levelSystem = new LevelSystem(); 