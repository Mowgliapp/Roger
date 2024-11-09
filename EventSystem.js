export class EventSystem {
    constructor() {
        this.events = new Map();
        this.activeEvents = new Map();
        this.initializeEvents();
    }

    initializeEvents() {
        // Special events
        this.events.set('double_coins', {
            id: 'double_coins',
            name: 'Double Coins Weekend',
            description: 'Earn double coins from all clicks!',
            duration: 48 * 60 * 60 * 1000, // 48 hours
            multiplier: 2,
            icon: 'double-coins.png',
            type: 'multiplier'
        });

        this.events.set('energy_rush', {
            id: 'energy_rush',
            name: 'Energy Rush Hour',
            description: 'Energy regenerates 2x faster!',
            duration: 1 * 60 * 60 * 1000, // 1 hour
            multiplier: 2,
            icon: 'energy-rush.png',
            type: 'energy'
        });

        this.events.set('lucky_hour', {
            id: 'lucky_hour',
            name: 'Lucky Hour',
            description: 'Chance for bonus coins on every click!',
            duration: 1 * 60 * 60 * 1000, // 1 hour
            bonusChance: 0.3,
            bonusMultiplier: 3,
            icon: 'lucky-hour.png',
            type: 'bonus'
        });
    }

    async startEvent(eventId) {
        const event = this.events.get(eventId);
        if (!event) return false;

        const now = Date.now();
        const endTime = now + event.duration;

        this.activeEvents.set(eventId, {
            ...event,
            startTime: now,
            endTime: endTime
        });

        // Save to database
        const eventRef = ref(this.game.db, `events/${eventId}`);
        await set(eventRef, {
            active: true,
            startTime: now,
            endTime: endTime
        });

        // Notify players
        this.game.ui.showEventStarted(event);
        return true;
    }

    async endEvent(eventId) {
        if (!this.activeEvents.has(eventId)) return false;

        this.activeEvents.delete(eventId);

        // Update database
        const eventRef = ref(this.game.db, `events/${eventId}`);
        await update(eventRef, {
            active: false,
            endedAt: Date.now()
        });

        // Notify players
        this.game.ui.showEventEnded(this.events.get(eventId));
        return true;
    }

    getActiveEvents() {
        const now = Date.now();
        const active = [];

        for (const [id, event] of this.activeEvents) {
            if (event.endTime > now) {
                active.push(event);
            } else {
                this.endEvent(id); // Clean up expired events
            }
        }

        return active;
    }

    isEventActive(eventId) {
        return this.activeEvents.has(eventId);
    }

    getEventMultiplier(type) {
        let multiplier = 1;
        
        for (const event of this.getActiveEvents()) {
            if (event.type === type) {
                multiplier *= event.multiplier || 1;
            }
        }

        return multiplier;
    }

    getEventTimeRemaining(eventId) {
        const event = this.activeEvents.get(eventId);
        if (!event) return 0;

        return Math.max(0, event.endTime - Date.now());
    }

    formatTimeRemaining(ms) {
        const hours = Math.floor(ms / (60 * 60 * 1000));
        const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((ms % (60 * 1000)) / 1000);

        return `${hours}h ${minutes}m ${seconds}s`;
    }
} 