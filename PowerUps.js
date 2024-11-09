export class PowerUpsSystem {
    constructor(gameEngine) {
        this.game = gameEngine;
        this.powerUps = new Map();
        this.activePowerUps = new Set();
        this.initializePowerUps();
    }

    initializePowerUps() {
        this.powerUps.set('double_clicks', {
            id: 'double_clicks',
            name: 'Double Clicks',
            description: 'Double your click rewards for 10 minutes!',
            duration: 10 * 60 * 1000, // 10 minutes
            multiplier: 2,
            icon: 'double-clicks.png',
            type: 'clicks'
        });

        this.powerUps.set('energy_boost', {
            id: 'energy_boost',
            name: 'Energy Boost',
            description: 'Instantly refill your energy!',
            duration: 0, // Instant effect
            icon: 'energy-boost.png',
            type: 'energy'
        });

        this.powerUps.set('coin_magnet', {
            id: 'coin_magnet',
            name: 'Coin Magnet',
            description: 'Attract extra coins for 5 minutes!',
            duration: 5 * 60 * 1000, // 5 minutes
            multiplier: 1.5,
            icon: 'coin-magnet.png',
            type: 'coins'
        });
    }

    async activatePowerUp(powerUpId) {
        const powerUp = this.powerUps.get(powerUpId);
        if (!powerUp || this.activePowerUps.has(powerUpId)) return false;

        const now = Date.now();
        const endTime = now + powerUp.duration;

        this.activePowerUps.add(powerUpId);

        if (powerUp.type === 'energy') {
            this.game.energy = this.game.maxEnergy;
            this.game.ui.updateEnergy();
        } else {
            // Save active power-up
            const powerUpRef = ref(this.game.db, `users/${this.game.user.username}/powerUps/${powerUpId}`);
            await set(powerUpRef, {
                active: true,
                startTime: now,
                endTime: endTime
            });
        }

        // Notify UI
        this.game.ui.showPowerUpActivated(powerUp);
        return true;
    }

    async deactivatePowerUp(powerUpId) {
        if (!this.activePowerUps.has(powerUpId)) return false;

        this.activePowerUps.delete(powerUpId);

        // Update database
        const powerUpRef = ref(this.game.db, `users/${this.game.user.username}/powerUps/${powerUpId}`);
        await update(powerUpRef, {
            active: false,
            endedAt: Date.now()
        });

        // Notify UI
        this.game.ui.showPowerUpDeactivated(this.powerUps.get(powerUpId));
        return true;
    }

    getActivePowerUps() {
        return Array.from(this.activePowerUps).map(id => this.powerUps.get(id));
    }

    isPowerUpActive(powerUpId) {
        return this.activePowerUps.has(powerUpId);
    }

    getPowerUpMultiplier(type) {
        let multiplier = 1;

        for (const powerUpId of this.activePowerUps) {
            const powerUp = this.powerUps.get(powerUpId);
            if (powerUp.type === type) {
                multiplier *= powerUp.multiplier || 1;
            }
        }

        return multiplier;
    }
} 