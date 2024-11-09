export class StatisticsSystem {
    constructor(gameEngine) {
        this.game = gameEngine;
        this.stats = {
            totalClicks: 0,
            totalCoinsEarned: 0,
            totalTasksCompleted: 0,
            totalReferrals: 0,
            totalAchievementsUnlocked: 0,
            playTime: 0
        };
        this.startTime = Date.now();
        this.initialize();
    }

    async initialize() {
        await this.loadStatistics();
        this.setupListeners();
    }

    async loadStatistics() {
        const statsRef = ref(this.game.db, `users/${this.game.user.username}/statistics`);
        const snapshot = await get(statsRef);
        const statsData = snapshot.val() || {};

        this.stats = { ...this.stats, ...statsData };
    }

    setupListeners() {
        this.game.addListener((event, data) => {
            switch (event) {
                case 'click':
                    this.stats.totalClicks++;
                    this.stats.totalCoinsEarned += data.reward;
                    break;
                case 'taskCompleted':
                    this.stats.totalTasksCompleted++;
                    break;
                case 'referralComplete':
                    this.stats.totalReferrals++;
                    break;
                case 'achievementUnlocked':
                    this.stats.totalAchievementsUnlocked++;
                    break;
            }
            this.saveStatistics();
        });
    }

    async saveStatistics() {
        const statsRef = ref(this.game.db, `users/${this.game.user.username}/statistics`);
        await set(statsRef, this.stats);
    }

    getPlayTime() {
        return this.stats.playTime + (Date.now() - this.startTime);
    }

    async updatePlayTime() {
        this.stats.playTime = this.getPlayTime();
        this.startTime = Date.now();
        await this.saveStatistics();
    }

    getStatistics() {
        return this.stats;
    }
} 