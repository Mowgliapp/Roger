export class ProgressionManager {
    constructor(userManager) {
        this.userManager = userManager;
        this.levels = this.generateLevels();
        this.milestones = this.generateMilestones();
    }

    generateLevels() {
        const levels = [];
        let requiredXP = 100;
        
        for (let i = 1; i <= 100; i++) {
            levels.push({
                level: i,
                requiredXP,
                rewards: {
                    coins: Math.floor(100 * Math.pow(1.1, i)),
                    energyBonus: Math.floor(i / 10),
                    unlocks: this.getLevelUnlocks(i)
                }
            });
            requiredXP = Math.floor(requiredXP * 1.2);
        }
        return levels;
    }

    generateMilestones() {
        return {
            clicks: [
                { count: 100, reward: 500 },
                { count: 1000, reward: 2000 },
                { count: 10000, reward: 10000 }
            ],
            coins: [
                { count: 10000, reward: 1000 },
                { count: 100000, reward: 5000 },
                { count: 1000000, reward: 25000 }
            ],
            referrals: [
                { count: 5, reward: 5000 },
                { count: 20, reward: 25000 },
                { count: 100, reward: 100000 }
            ]
        };
    }

    getLevelUnlocks(level) {
        const unlocks = [];
        
        switch(level) {
            case 5:
                unlocks.push({
                    type: 'feature',
                    id: 'daily_bonus',
                    name: 'Daily Bonus'
                });
                break;
            case 10:
                unlocks.push({
                    type: 'multiplier',
                    id: 'click_multiplier',
                    value: 2
                });
                break;
            case 20:
                unlocks.push({
                    type: 'feature',
                    id: 'energy_boost',
                    name: 'Energy Boost'
                });
                break;
            // Add more unlocks
        }
        
        return unlocks;
    }

    async checkLevelUp(xp) {
        const currentLevel = await this.userManager.getLevel();
        const nextLevel = this.levels.find(l => l.level === currentLevel + 1);
        
        if (xp >= nextLevel.requiredXP) {
            await this.levelUp(currentLevel + 1);
            return true;
        }
        return false;
    }

    async levelUp(newLevel) {
        const levelData = this.levels.find(l => l.level === newLevel);
        
        // Apply rewards
        await this.userManager.addCoins(levelData.rewards.coins);
        await this.userManager.updateLevel(newLevel);
        
        // Handle unlocks
        for (const unlock of levelData.rewards.unlocks) {
            await this.handleUnlock(unlock);
        }

        // Show level up notification
        this.showLevelUpNotification(newLevel, levelData.rewards);
    }

    showLevelUpNotification(level, rewards) {
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        
        notification.innerHTML = `
            <div class="level-up-content">
                <h3>Level Up! 🎉</h3>
                <div class="new-level">Level ${level}</div>
                <div class="rewards-list">
                    <div class="reward-item">
                        <img src="assets/images/coin.gif" width="20" height="20">
                        <span>+${rewards.coins}</span>
                    </div>
                    ${rewards.unlocks.map(unlock => `
                        <div class="unlock-item">
                            <i class="fas fa-unlock"></i>
                            <span>Unlocked: ${unlock.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
} 