import { getDatabase, ref, update, get } from "firebase/database";

export const RewardSystem = {
    settings: {
        watchVideoReward: 1000,
        dailyLimit: 5,
        cooldownPeriod: 3600000 // 1 hour
    },

    async showRewardedContent(username) {
        // Show a loading animation or content
        await this.simulateAdView();
        await this.giveReward(username);
    },

    async simulateAdView() {
        return new Promise(resolve => {
            Telegram.WebApp.showPopup({
                title: "Loading Content",
                message: "Watch for 30 seconds to earn coins",
                buttons: [
                    {type: "ok", text: "Continue"}
                ]
            }, () => {
                setTimeout(resolve, 30000); // 30 second wait
            });
        });
    },

    async giveReward(username) {
        const db = getDatabase();
        const userRef = ref(db, `users/${username}`);
        
        try {
            const snapshot = await get(userRef);
            if (snapshot.exists()) {
                const currentCoins = snapshot.val().coins || 0;
                await update(userRef, {
                    coins: currentCoins + this.settings.watchVideoReward,
                    lastUpdated: Date.now()
                });
                
                Telegram.WebApp.showPopup({
                    title: "Success!",
                    message: `You earned ${this.settings.watchVideoReward} coins!`
                });
            }
        } catch (error) {
            console.error("Error giving reward:", error);
        }
    }
};