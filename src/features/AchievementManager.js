export class AchievementManager {
    constructor(userManager) {
        this.userManager = userManager;
        this.achievements = {
            CLICKS: {
                BEGINNER: { id: 'clicks_100', requirement: 100, reward: 500 },
                INTERMEDIATE: { id: 'clicks_1000', requirement: 1000, reward: 2000 },
                EXPERT: { id: 'clicks_10000', requirement: 10000, reward: 10000 }
            },
            REFERRALS: {
                INFLUENCER: { id: 'referrals_5', requirement: 5, reward: 5000 },
                VIRAL: { id: 'referrals_20', requirement: 20, reward: 25000 }
            },
            DAILY: {
                CONSISTENT: { id: 'daily_7', requirement: 7, reward: 1000 },
                DEDICATED: { id: 'daily_30', requirement: 30, reward: 5000 }
            }
        };
    }

    async checkAchievements(category, value) {
        const userAchievements = await this.getUserAchievements();
        const categoryAchievements = this.achievements[category];

        for (const [level, achievement] of Object.entries(categoryAchievements)) {
            if (value >= achievement.requirement && !userAchievements.includes(achievement.id)) {
                await this.awardAchievement(achievement);
            }
        }
    }

    async awardAchievement(achievement) {
        // Update user's achievements and coins
        await this.userManager.addAchievement(achievement.id);
        await this.userManager.updateCoins(
            await this.userManager.getCoins() + achievement.reward
        );

        // Show achievement notification
        this.showAchievementNotification(achievement);
    }

    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">🏆</div>
            <div class="achievement-content">
                <h4>Achievement Unlocked!</h4>
                <p>${achievement.title}</p>
                <div class="achievement-reward">
                    +${achievement.reward}
                    <img src="assets/images/coin.gif" width="20" height="20" alt="coins">
                </div>
            </div>
        `;

        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }, 100);
    }
} 