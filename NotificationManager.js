export class NotificationManager {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 3;
        this.types = {
            SUCCESS: 'success',
            ERROR: 'error',
            WARNING: 'warning',
            INFO: 'info',
            ACHIEVEMENT: 'achievement'
        };
    }

    show(message, type = 'info', duration = 3000) {
        const notification = {
            id: Date.now(),
            message,
            type,
            duration
        };

        this.addNotification(notification);
        this.createNotificationElement(notification);

        if (duration > 0) {
            setTimeout(() => this.remove(notification.id), duration);
        }
    }

    createNotificationElement(notification) {
        const element = document.createElement('div');
        element.className = `notification ${notification.type}`;
        element.id = `notification-${notification.id}`;
        
        element.innerHTML = `
            <div class="notification-content">
                <i class="notification-icon fas ${this.getIconForType(notification.type)}"></i>
                <span class="notification-message">${notification.message}</span>
                <button class="notification-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            ${notification.duration > 0 ? `
                <div class="notification-progress">
                    <div class="progress-bar"></div>
                </div>
            ` : ''}
        `;

        const container = this.getOrCreateContainer();
        container.appendChild(element);

        // Add close button handler
        element.querySelector('.notification-close').addEventListener('click', () => {
            this.remove(notification.id);
        });

        // Animate in
        requestAnimationFrame(() => {
            element.classList.add('show');
        });
    }

    getOrCreateContainer() {
        let container = document.querySelector('.notifications-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notifications-container';
            document.body.appendChild(container);
        }
        return container;
    }

    remove(id) {
        const element = document.getElementById(`notification-${id}`);
        if (element) {
            element.classList.remove('show');
            setTimeout(() => element.remove(), 300);
        }
        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    getIconForType(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle',
            achievement: 'fa-trophy'
        };
        return icons[type] || icons.info;
    }
} 