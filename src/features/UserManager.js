import { getDatabase, ref, set, get, onValue } from 'firebase/database';

export class UserManager {
    constructor(username) {
        this.db = getDatabase();
        this.username = username;
        this.userRef = ref(this.db, `users/${username}`);
    }

    async initializeUser() {
        const snapshot = await get(this.userRef);
        if (!snapshot.exists()) {
            await set(this.userRef, {
                coins: 0,
                energy: 100,
                lastUpdated: Date.now(),
                referrals: [],
                tasks: {
                    daily: {},
                    social: {},
                    achievement: {}
                }
            });
        }
    }

    onUserDataChange(callback) {
        onValue(this.userRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.val());
            }
        });
    }

    async updateCoins(coins) {
        await set(ref(this.db, `users/${this.username}/coins`), coins);
    }

    async updateEnergy(energy) {
        await set(ref(this.db, `users/${this.username}/energy`), energy);
    }

    async addReferral(referralUsername) {
        const referralsRef = ref(this.db, `users/${this.username}/referrals`);
        const snapshot = await get(referralsRef);
        const referrals = snapshot.val() || [];
        
        if (!referrals.includes(referralUsername)) {
            referrals.push(referralUsername);
            await set(referralsRef, referrals);
            await this.updateCoins(await this.getCoins() + 1000); // Referral bonus
        }
    }
} 