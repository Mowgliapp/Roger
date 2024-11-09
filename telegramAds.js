export const TelegramAds = {
    settings: {
        rewardAmount: 1000,
        cooldown: 300000, // 5 minutes between ads
        lastAdTime: 0
    },

    async showAd() {
        if (!window.TelegramGameProxy) {
            console.error('Telegram Ads not available');
            return;
        }

        const now = Date.now();
        if (now - this.settings.lastAdTime < this.settings.cooldown) {
            Telegram.WebApp.showPopup({
                title: 'Please Wait',
                message: 'You can watch another ad in ' + 
                    Math.ceil((this.settings.cooldown - (now - this.settings.lastAdTime)) / 1000) + 
                    ' seconds'
            });
            return;
        }

        try {
            window.TelegramGameProxy.showAd(() => {
                // Ad completed successfully
                this.settings.lastAdTime = Date.now();
                this.giveReward();
            });
        } catch (error) {
            console.error('Error showing ad:', error);
        }
    },

    async giveReward() {
        const user = Telegram.WebApp.initDataUnsafe.user;
        if (!user?.username) return;

        try {
            // Update user's coins in Firebase
            const userRef = ref(db, `users/${user.username}`);
            const snapshot = await get(userRef);
            const currentCoins = snapshot.val()?.coins || 0;

            await update(userRef, {
                coins: currentCoins + this.settings.rewardAmount,
                lastUpdated: Date.now()
            });

            Telegram.WebApp.showPopup({
                title: 'Reward Received!',
                message: `You earned ${this.settings.rewardAmount} coins!`
            });
        } catch (error) {
            console.error('Error giving reward:', error);
        }
    }
};