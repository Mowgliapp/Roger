export class BotCommands {
    constructor(gameEngine) {
        this.game = gameEngine;
        this.commands = new Map();
        this.initializeCommands();
    }

    initializeCommands() {
        this.commands.set('start', async (params) => {
            // Handle referral
            if (params) {
                await this.handleReferral(params);
            }
            return this.showWelcomeMessage();
        });

        this.commands.set('daily', async () => {
            return await this.claimDailyReward();
        });

        this.commands.set('profile', () => {
            return this.showProfile();
        });

        this.commands.set('top', () => {
            return this.showLeaderboard();
        });

        this.commands.set('help', () => {
            return this.showHelp();
        });
    }

    async handleCommand(command, params) {
        const handler = this.commands.get(command.toLowerCase());
        if (handler) {
            return await handler(params);
        }
        return 'Unknown command. Type /help for available commands.';
    }

    async handleReferral(referralCode) {
        try {
            const referralRef = ref(this.game.db, `referrals/${referralCode}`);
            const referrerSnapshot = await get(referralRef);
            
            if (!referrerSnapshot.exists()) {
                return 'Invalid referral code';
            }

            // Check if user already used a referral
            const userRef = ref(this.game.db, `users/${this.game.user.username}/referredBy`);
            const userReferralSnapshot = await get(userRef);
            
            if (userReferralSnapshot.exists()) {
                return 'You have already used a referral code';
            }

            // Update referral data
            await update(referralRef, {
                [`${this.game.user.username}`]: {
                    joinedAt: Date.now(),
                    processed: false
                }
            });

            // Save referrer for user
            await set(userRef, referralCode);

            return 'Successfully joined using referral code!';
        } catch (error) {
            console.error('Referral error:', error);
            return 'Failed to process referral code';
        }
    }

    async claimDailyReward() {
        const userRef = ref(this.game.db, `users/${this.game.user.username}/dailyReward`);
        const snapshot = await get(userRef);
        const lastClaim = snapshot.val();
        
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        if (lastClaim && (now - lastClaim) < oneDayMs) {
            const timeLeft = oneDayMs - (now - lastClaim);
            const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
            const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
            
            return `Daily reward not ready yet. Come back in ${hoursLeft}h ${minutesLeft}m`;
        }

        // Award daily reward
        const reward = 100;
        await this.game.updateCoins(reward);
        await set(userRef, now);
        
        return `Claimed daily reward: ${reward} coins!`;
    }

    showProfile() {
        const { coins, level, xp } = this.game;
        const nextLevelXP = this.game.getLevelRequirement();
        
        return `🎮 Player Profile
        
Username: ${this.game.user.username}
Level: ${level}
XP: ${xp}/${nextLevelXP}
Coins: ${coins}
Daily Streak: ${this.game.dailyStreak || 0}
Tasks Completed: ${this.game.tasks.completedTasks.size}`;
    }

    async showLeaderboard() {
        const leaderboardRef = ref(this.game.db, 'users');
        const snapshot = await get(leaderboardRef);
        const users = snapshot.val();
        
        const leaderboard = Object.entries(users)
            .map(([username, data]) => ({
                username,
                coins: data.coins || 0,
                level: data.level || 1
            }))
            .sort((a, b) => b.coins - a.coins)
            .slice(0, 10);

        return `🏆 Top 10 Players

${leaderboard.map((user, index) => 
    `${index + 1}. ${user.username} - Level ${user.level} (${user.coins} coins)`
).join('\n')}`;
    }

    showHelp() {
        return `🎮 Available Commands:

/start - Start the game
/daily - Claim daily reward
/profile - View your profile
/top - Show leaderboard
/help - Show this help message

🎯 Game Tips:
• Click to earn coins
• Complete daily tasks
• Invite friends for bonus rewards
• Reach higher levels for multipliers
• Save energy for special events`;
    }
} 