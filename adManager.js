export const TelegramAdManager = {
    showAd() {
        if (window.Telegram?.WebApp) {
            // Use Telegram's native ad functionality
            Telegram.WebApp.showPopup({
                title: "Watch Ad",
                message: "Watch a short ad to earn 1000 coins!",
                buttons: [{
                    type: "ok",
                    text: "Watch"
                }]
            }, (buttonId) => {
                if (buttonId === "ok") {
                    // Reward user after watching
                    this.rewardUser(1000);
                }
            });
        }
    },

    rewardUser(amount) {
        // Your reward logic here
    }
};