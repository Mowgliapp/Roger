export class AchievementSystem {
    constructor(gameEngine) {
        this.game = gameEngine;
        this.achievements = new Map();
        this.unlockedAchievements = new Set();
        this.initializeAchievements();
    }

    initializeAchievements() {
        // Clicking achievements
        this.achievements.set('clicker_novice', {
            id: 'clicker_novice',
            title: 'Click Novice',
            description: 'Click 1,000 times',
            requirement: 1000,
            type: 'clicks',
            reward: 100,
            icon: 'click-achievement.png'
        });

        this.achievements.set('clicker_master', {
            id: 'clicker_master',
            title: 'Click Master',
            description: 'Click 10,000 times',
            requirement: 10000,
            type: 'clicks',
            reward: 500,
            icon: 'click-master.png'
        });

        // Level achievements
        this.achievements.set('level_5', {
            id: 'level_5',
            title: 'Rising Star',
            description: 'Reach level 5',
            requirement: 5,
            type: 'level',
            reward: 200,
            icon: 'level-star.png'
        });

        this.achievements.set('level_10', {
            id: 'level_10',
            title: 'Expert Player',
            description: 'Reach level 10',
            requirement: 10,
            type: 'level',
            reward: 500,
            icon: 'level-expert.png'
        });

        // Coin achievements
        this.achievements.set('rich_beginner', {
            id: 'rich_beginner',
            title: 'Rich Beginner',
            description: 'Accumulate 10,000 coins',
            requirement: 10000,
            type: 'coins',
            reward: 1000,
            icon: 'coins-beginner.png'
        });

        // Social achievements
        this.achievements.set('social_butterfly', {
            id: 'social_butterfly',
            title: 'Social Butterfly',
            description: 'Invite 5 friends',
            requirement: 5,
            type: 'referrals',
            reward: 300,
            icon: 'social-butterfly.png'
        });
    }

    async loadUserAchievements() {
        const achievementsRef = ref(this.game.db, `users/${this.game.user.username}/achievements`);
        const snapshot = await get(achievementsRef);
        const achievements = snapshot.val() || {};

        for (const [achievementId, data] of Object.entries(achievements)) {
            if (data.unlocked) {
                this.unlockedAchievements.add(achievementId);
            }
        }
    }

    async checkAchievement(type, value) {
        for (const [id, achievement] of this.achievements) {
            if (achievement.type === type && 
                value >= achievement.requirement && 
                !this.unlockedAchievements.has(id)) {
                await this.unlockAchievement(id);
            }
        }
    }

    async unlockAchievement(achievementId) {
        const achievement = this.achievements.get(achievementId);
        if (!achievement || this.unlockedAchievements.has(achievementId)) return;

        // Mark as unlocked
        this.unlockedAchievements.add(achievementId);

        // Save to database
        const achievementRef = ref(this.game.db, 
            `users/${this.game.user.username}/achievements/${achievementId}`);
        await set(achievementRef, {
            unlocked: true,
            unlockedAt: Date.now()
        });

        // Award coins
        await this.game.updateCoins(achievement.reward);

        // Show notification
        this.game.ui.showAchievementUnlocked(achievement);

        // Play sound
        this.game.sound.play('achievement');
    }

    getProgress(achievementId) {
        const achievement = this.achievements.get(achievementId);
        if (!achievement) return 0;

        let currentValue = 0;
        switch (achievement.type) {
            case 'clicks':
                currentValue = this.game.totalClicks;
                break;
            case 'level':
                currentValue = this.game.level;
                break;
            case 'coins':
                currentValue = this.game.coins;
                break;
            case 'referrals':
                currentValue = this.game.friends.getFriendsList().length;
                break;
        }

        return Math.min(100, (currentValue / achievement.requirement) * 100);
    }

    isUnlocked(achievementId) {
        return this.unlockedAchievements.has(achievementId);
    }

    getAllAchievements() {
        return Array.from(this.achievements.values());
    }
} 