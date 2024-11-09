export class DailyChallengesSystem {
    constructor(gameEngine) {
        this.game = gameEngine;
        this.challenges = new Map();
        this.completedChallenges = new Set();
        this.initializeChallenges();
    }

    initializeChallenges() {
        this.challenges.set('click_challenge', {
            id: 'click_challenge',
            title: 'Click Challenge',
            description: 'Click 200 times today',
            target: 200,
            progress: 0,
            reward: 100,
            icon: 'click-challenge.png'
        });

        this.challenges.set('energy_challenge', {
            id: 'energy_challenge',
            title: 'Energy Saver',
            description: 'Use less than 50 energy today',
            target: 50,
            progress: 0,
            reward: 50,
            icon: 'energy-challenge.png'
        });

        this.challenges.set('coin_challenge', {
            id: 'coin_challenge',
            title: 'Coin Collector',
            description: 'Earn 500 coins today',
            target: 500,
            progress: 0,
            reward: 150,
            icon: 'coin-challenge.png'
        });
    }

    async loadUserChallenges() {
        const challengesRef = ref(this.game.db, `users/${this.game.user.username}/dailyChallenges`);
        const snapshot = await get(challengesRef);
        const challengesData = snapshot.val() || {};

        for (const [challengeId, challengeData] of Object.entries(challengesData)) {
            if (this.challenges.has(challengeId)) {
                this.challenges.get(challengeId).progress = challengeData.progress;
                if (challengeData.completed) {
                    this.completedChallenges.add(challengeId);
                }
            }
        }
    }

    async updateChallengeProgress(challengeId, progress) {
        if (!this.challenges.has(challengeId) || this.completedChallenges.has(challengeId)) return;

        const challenge = this.challenges.get(challengeId);
        challenge.progress = Math.min(challenge.target, challenge.progress + progress);

        if (challenge.progress >= challenge.target) {
            await this.completeChallenge(challengeId);
        }

        await this.saveChallengeProgress(challengeId);
    }

    async completeChallenge(challengeId) {
        const challenge = this.challenges.get(challengeId);
        if (!challenge || this.completedChallenges.has(challengeId)) return;

        await this.game.updateCoins(challenge.reward);
        this.completedChallenges.add(challengeId);

        const challengeRef = ref(this.game.db, `users/${this.game.user.username}/dailyChallenges/${challengeId}`);
        await update(challengeRef, {
            completed: true,
            completedAt: Date.now()
        });

        this.game.ui.showChallengeComplete(challenge);
    }

    async saveChallengeProgress(challengeId) {
        const challenge = this.challenges.get(challengeId);
        const challengeRef = ref(this.game.db, `users/${this.game.user.username}/dailyChallenges/${challengeId}`);
        await update(challengeRef, {
            progress: challenge.progress,
            updatedAt: Date.now()
        });
    }

    getChallengeProgress(challengeId) {
        return this.challenges.get(challengeId)?.progress || 0;
    }

    isChallengeCompleted(challengeId) {
        return this.completedChallenges.has(challengeId);
    }

    getAllChallenges() {
        return Array.from(this.challenges.values());
    }
} 