export class FriendSystem {
    constructor(gameEngine) {
        this.game = gameEngine;
        this.friends = new Map();
        this.referralCode = null;
        this.referralBonus = 50; // Coins per referral
    }

    async initialize() {
        await this.loadReferralCode();
        await this.loadFriends();
        this.setupReferralListeners();
    }

    async loadReferralCode() {
        const userRef = ref(this.game.db, `users/${this.game.user.username}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val() || {};

        this.referralCode = userData.referralCode || this.generateReferralCode();
        if (!userData.referralCode) {
            await update(userRef, { referralCode: this.referralCode });
        }
    }

    generateReferralCode() {
        return `${this.game.user.username}_${Math.random().toString(36).substr(2, 6)}`;
    }

    async loadFriends() {
        const friendsRef = ref(this.game.db, `users/${this.game.user.username}/friends`);
        const snapshot = await get(friendsRef);
        const friendsData = snapshot.val() || {};

        for (const [friendId, friendData] of Object.entries(friendsData)) {
            this.friends.set(friendId, {
                username: friendData.username,
                level: friendData.level || 1,
                joinedAt: friendData.joinedAt,
                lastActive: friendData.lastActive
            });
        }
    }

    setupReferralListeners() {
        const referralsRef = ref(this.game.db, `referrals/${this.referralCode}`);
        onValue(referralsRef, async (snapshot) => {
            const referrals = snapshot.val() || {};
            for (const [userId, referralData] of Object.entries(referrals)) {
                if (!referralData.processed) {
                    await this.processReferral(userId);
                }
            }
        });
    }

    async processReferral(userId) {
        // Award bonus to both referrer and referee
        await this.game.updateCoins(this.referralBonus);
        
        // Mark referral as processed
        const referralRef = ref(this.game.db, `referrals/${this.referralCode}/${userId}`);
        await update(referralRef, {
            processed: true,
            processedAt: Date.now()
        });

        // Update tasks progress
        await this.game.tasks.updateTaskProgress('invite_friends', 1);

        // Show notification
        this.game.ui.showReferralComplete(this.referralBonus);
    }

    async addFriend(username) {
        if (this.friends.has(username)) return false;

        const friendRef = ref(this.game.db, `users/${this.game.user.username}/friends/${username}`);
        await set(friendRef, {
            username,
            joinedAt: Date.now(),
            lastActive: Date.now()
        });

        this.friends.set(username, {
            username,
            level: 1,
            joinedAt: Date.now(),
            lastActive: Date.now()
        });

        return true;
    }

    getFriendsList() {
        return Array.from(this.friends.values());
    }

    async shareReferralLink() {
        const referralLink = `https://t.me/your_bot?start=${this.referralCode}`;
        
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.switchInlineQuery(referralLink);
        }
        
        return referralLink;
    }
} 