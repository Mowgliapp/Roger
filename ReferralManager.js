export class ReferralManager {
    constructor(userManager) {
        this.userManager = userManager;
    }

    generateReferralLink() {
        return `https://mowgli.ngrok.app/invite?ref=${this.userManager.username}`;
    }

    async handleReferral(referralCode) {
        if (referralCode && referralCode !== this.userManager.username) {
            await this.userManager.addReferral(referralCode);
        }
    }

    // ... (implement sharing methods)
} 