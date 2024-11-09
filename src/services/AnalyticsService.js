export class AnalyticsService {
    constructor() {
        this.events = {
            CLICK: 'click',
            TASK_COMPLETE: 'task_complete',
            REFERRAL: 'referral',
            ENERGY_DEPLETED: 'energy_depleted',
            LEVEL_UP: 'level_up'
        };
    }

    trackEvent(eventName, data = {}) {
        // Add timestamp
        data.timestamp = Date.now();
        
        // Track to Firebase Analytics
        if (window.firebase?.analytics) {
            window.firebase.analytics().logEvent(eventName, data);
        }

        // Save locally for offline tracking
        this.saveEventLocally(eventName, data);
    }

    saveEventLocally(eventName, data) {
        const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
        events.push({ eventName, data });
        localStorage.setItem('analytics_events', JSON.stringify(events));
    }

    syncOfflineEvents() {
        const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
        if (events.length && window.firebase?.analytics) {
            events.forEach(({ eventName, data }) => {
                window.firebase.analytics().logEvent(eventName, data);
            });
            localStorage.removeItem('analytics_events');
        }
    }
} 