export class TelegramManager {
    constructor() {
        this.webapp = window.Telegram?.WebApp;
        this.user = null;
    }

    async initialize() {
        if (!this.webapp) {
            throw new Error('Telegram WebApp not available');
        }

        this.webapp.ready();
        this.user = this.webapp.initDataUnsafe?.user;
        
        if (!this.user) {
            throw new Error('User not authenticated');
        }

        // Setup Telegram UI
        this.webapp.expand();
        this.setupMainButton();
        
        return true;
    }

    setupMainButton() {
        if (this.webapp.MainButton) {
            this.webapp.MainButton.setText('Collect Rewards');
            this.webapp.MainButton.onClick(() => {
                this.sendMessage('collect_rewards');
            });
        }
    }

    getUser() {
        return this.user;
    }

    sendMessage(action, data = {}) {
        if (this.webapp) {
            this.webapp.sendData(JSON.stringify({
                action,
                ...data
            }));
        }
    }

    showAlert(message) {
        if (this.webapp) {
            this.webapp.showAlert(message);
        }
    }
}
