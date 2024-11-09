import { getDatabase, ref, set, get, update, onValue } from 'firebase/database';

export class UserService {
    constructor() {
        this.db = getDatabase();
    }

    async initializeUser(username) {
        if (!username) return;
        
        const userRef = ref(this.db, `users/${username}`);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) {
            await set(userRef, {
                username: username,
                coins: 0,
                joinDate: Date.now(),
                referrals: {},
                referredBy: null,
                lastActive: Date.now()
            });
        }
    }

    async handleReferral(newUser, referrerUsername) {
        if (!newUser || !referrerUsername || newUser === referrerUsername) return;

        try {
            const referrerRef = ref(this.db, `users/${referrerUsername}`);
            const referrerSnapshot = await get(referrerRef);

            if (referrerSnapshot.exists()) {
                // Update referrer's referrals
                await update(referrerRef, {
                    [`referrals/${newUser}`]: Date.now()
                });

                // Update new user's referredBy
                const newUserRef = ref(this.db, `users/${newUser}`);
                await update(newUserRef, {
                    referredBy: referrerUsername
                });

                // Add bonus coins to referrer
                const currentCoins = referrerSnapshot.val().coins || 0;
                await update(referrerRef, {
                    coins: currentCoins + 1000
                });

                return true;
            }
        } catch (error) {
            console.error('Error handling referral:', error);
        }
        return false;
    }

    async getReferrals(username) {
        if (!username) return {};
        
        try {
            const userRef = ref(this.db, `users/${username}/referrals`);
            const snapshot = await get(userRef);
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error getting referrals:', error);
            return {};
        }
    }

    async addCoins(username, amount) {
        if (!username || !amount) return false;
        
        try {
            const userRef = ref(this.db, `users/${username}`);
            const snapshot = await get(userRef);
            
            if (snapshot.exists()) {
                const currentCoins = snapshot.val().coins || 0;
                await update(userRef, {
                    coins: currentCoins + amount,
                    lastUpdated: Date.now()
                });
                return true;
            }
        } catch (error) {
            console.error('Error adding coins:', error);
        }
        return false;
    }
} 