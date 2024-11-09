class NotificationManager {
    constructor() {
        this.initialize();
    }

    initialize() {
        this.checkPermission();
    }

    async checkPermission() {
        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }

    async showNotification(title, options = {}) {
        const settings = JSON.parse(localStorage.getItem('userSettings')) || {};
        
        if (!settings.notifications) return;
        
        if (Notification.permission === 'granted') {
            const defaultOptions = {
                icon: 'assets/images/icon.png',
                badge: 'assets/images/badge.png',
                vibrate: settings.vibration ? [200, 100, 200] : undefined,
                tag: 'mowgli-notification',
                renotify: true,
                requireInteraction: false,
                silent: !settings.soundEffects
            };

            const notification = new Notification(title, { ...defaultOptions, ...options });
            
            notification.onclick = function() {
                window.focus();
                notification.close();
            };
        }
    }

    async scheduleNotification(title, options = {}, delay) {
        setTimeout(() => {
            this.showNotification(title, options);
        }, delay);
    }
}

// Create global notification manager instance
window.notificationManager = new NotificationManager();
export { notificationManager }; 