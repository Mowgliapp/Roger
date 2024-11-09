export class SocialManager {
    constructor(userManager) {
        this.userManager = userManager;
        this.platforms = {
            TELEGRAM: 'telegram',
            TWITTER: 'twitter',
            DISCORD: 'discord'
        };
        
        this.shareMessages = {
            default: "I'm playing Mowgli! Join me and get 1000 coins! 🎮✨",
            milestone: "Just reached {milestone} coins in Mowgli! Can you beat my score? 🏆",
            achievement: "Just unlocked {achievement} in Mowgli! 🎉"
        };
    }

    async shareToTelegram(type = 'default', data = {}) {
        const message = this.formatShareMessage(type, data);
        const url = `https://t.me/share/url?url=${encodeURIComponent(this.userManager.referralLink)}&text=${encodeURIComponent(message)}`;
        
        window.open(url, '_blank');
        await this.trackShare('telegram');
    }

    async shareToTwitter(type = 'default', data = {}) {
        const message = this.formatShareMessage(type, data);
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(this.userManager.referralLink)}`;
        
        window.open(url, '_blank');
        await this.trackShare('twitter');
    }

    formatShareMessage(type, data) {
        let message = this.shareMessages[type];
        return message.replace(/{(\w+)}/g, (match, key) => data[key] || match);
    }

    async trackShare(platform) {
        await this.userManager.incrementShareCount(platform);
        // Add share bonus if applicable
        if (await this.checkShareMilestone()) {
            await this.userManager.addCoins(500); // Bonus for sharing
        }
    }
} 