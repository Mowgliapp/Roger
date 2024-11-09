class AchievementSystem {
    constructor() {
        this.achievements = {
            clicks: [
                { id: 'clicks_100', name: 'Beginner Clicker', requirement: 100, reward: 500 },
                { id: 'clicks_1000', name: 'Advanced Clicker', requirement: 1000, reward: 2000 },
                { id: 'clicks_10000', name: 'Master Clicker', requirement: 10000, reward: 10000 }
            ],
            levels: [
                { id: 'level_5', name: 'Rising Star', requirement: 5, reward: 1000 },
                { id: 'level_10', name: 'Experienced', requirement: 10, reward: 3000 },
                { id: 'level_20', name: 'Veteran', requirement: 20, reward: 8000 }
            ],
            coins: [
                { id: 'coins_10000', name: 'Wealthy', requirement: 10000, reward: 1000 },
                { id: 'coins_100000', name: 'Rich', requirement: 100000, reward: 5000 },
                { id: 'coins_1000000', name: 'Millionaire', requirement: 1000000, reward: 20000 }
            ],
            daily: [
                { id: 'daily_3', name: 'Consistent', requirement: 3, reward: 1000 },
                { id: 'daily_7', name: 'Dedicated', requirement: 7, reward: 2000 },
                { id: 'daily_30', name: 'Loyal', requirement: 30, reward: 10000 }
            ]
        };

        this.unlockedAchievements = JSON.parse(localStorage.getItem('achievements')) || {};
        this.initialize();
    }

    initialize() {
        this.checkAchievements();
        this.updateUI();
        this.attachEventListeners();
    }

    checkAchievements() {
        // Check clicks achievements
        const totalClicks = parseInt(localStorage.getItem('totalClicks')) || 0;
        this.achievements.clicks.forEach(achievement => {
            if (totalClicks >= achievement.requirement) {
                this.unlockAchievement(achievement);
            }
        });

        // Check level achievements
        const currentLevel = parseInt(localStorage.getItem('level')) || 1;
        this.achievements.levels.forEach(achievement => {
            if (currentLevel >= achievement.requirement) {
                this.unlockAchievement(achievement);
            }
        });

        // Check coins achievements
        const totalCoins = mowgliApp.coins;
        this.achievements.coins.forEach(achievement => {
            if (totalCoins >= achievement.requirement) {
                this.unlockAchievement(achievement);
            }
        });

        // Check daily login achievements
        const dailyLogins = parseInt(localStorage.getItem('dailyLogins')) || 0;
        this.achievements.daily.forEach(achievement => {
            if (dailyLogins >= achievement.requirement) {
                this.unlockAchievement(achievement);
            }
        });
    }

    unlockAchievement(achievement) {
        if (!this.unlockedAchievements[achievement.id]) {
            this.unlockedAchievements[achievement.id] = {
                unlockedAt: new Date().toISOString(),
                claimed: false
            };
            
            localStorage.setItem('achievements', JSON.stringify(this.unlockedAchievements));
            
            // Show notification
            notificationManager.showNotification(
                'Achievement Unlocked!',
                {
                    body: `${achievement.name} - Reward: ${achievement.reward} coins`,
                    icon: 'assets/images/achievement.png'
                }
            );
            
            // Play sound
            soundManager.play('achievement');
            
            this.showUnlockAnimation(achievement);
            this.updateUI();
        }
    }

    claimReward(achievementId) {
        const achievement = this.findAchievement(achievementId);
        if (achievement && this.unlockedAchievements[achievementId] && !this.unlockedAchievements[achievementId].claimed) {
            mowgliApp.updateCoins(achievement.reward);
            this.unlockedAchievements[achievementId].claimed = true;
            localStorage.setItem('achievements', JSON.stringify(this.unlockedAchievements));
            this.updateUI();
            return true;
        }
        return false;
    }

    findAchievement(achievementId) {
        for (const category of Object.values(this.achievements)) {
            const achievement = category.find(a => a.id === achievementId);
            if (achievement) return achievement;
        }
        return null;
    }

    showUnlockAnimation(achievement) {
        const unlockOverlay = document.createElement('div');
        unlockOverlay.className = 'achievement-unlock-overlay';
        unlockOverlay.innerHTML = `
            <div class="achievement-unlock-content">
                <h3>Achievement Unlocked!</h3>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-reward">+${achievement.reward} coins</div>
            </div>
        `;

        document.body.appendChild(unlockOverlay);
        setTimeout(() => unlockOverlay.remove(), 3000);
    }

    updateUI() {
        const achievementsList = document.getElementById('achievements-list');
        if (!achievementsList) return;

        let html = '';
        for (const [category, achievements] of Object.entries(this.achievements)) {
            html += `
                <div class="achievements-category">
                    <h3>${category.charAt(0).toUpperCase() + category.slice(1)}</h3>
                    <div class="achievements-grid">
                        ${achievements.map(achievement => this.renderAchievement(achievement)).join('')}
                    </div>
                </div>
            `;
        }
        achievementsList.innerHTML = html;
    }

    renderAchievement(achievement) {
        const unlocked = this.unlockedAchievements[achievement.id];
        const claimed = unlocked?.claimed;
        
        return `
            <div class="achievement-card ${unlocked ? 'unlocked' : ''} ${claimed ? 'claimed' : ''}">
                <div class="achievement-icon">
                    <img src="assets/images/achievements/${achievement.id}.png" alt="${achievement.name}">
                </div>
                <div class="achievement-info">
                    <h4>${achievement.name}</h4>
                    <p>${this.getAchievementDescription(achievement)}</p>
                    ${unlocked && !claimed ? 
                        `<button onclick="achievementSystem.claimReward('${achievement.id}')">
                            Claim ${achievement.reward} coins
                        </button>` : 
                        ''
                    }
                </div>
            </div>
        `;
    }

    getAchievementDescription(achievement) {
        const progress = this.getAchievementProgress(achievement);
        return `Progress: ${progress}/${achievement.requirement}`;
    }

    getAchievementProgress(achievement) {
        if (achievement.id.startsWith('clicks_')) {
            return parseInt(localStorage.getItem('totalClicks')) || 0;
        } else if (achievement.id.startsWith('level_')) {
            return parseInt(localStorage.getItem('level')) || 1;
        } else if (achievement.id.startsWith('coins_')) {
            return mowgliApp.coins;
        } else if (achievement.id.startsWith('daily_')) {
            return parseInt(localStorage.getItem('dailyLogins')) || 0;
        }
        return 0;
    }

    attachEventListeners() {
        // Add click event listener
        const coinElement = document.getElementById('coin');
        if (coinElement) {
            coinElement.addEventListener('click', () => {
                const totalClicks = (parseInt(localStorage.getItem('totalClicks')) || 0) + 1;
                localStorage.setItem('totalClicks', totalClicks);
                this.checkAchievements();
            });
        }
    }
}

export const achievementSystem = new AchievementSystem(); 