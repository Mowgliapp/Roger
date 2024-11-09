import { db, ref, set, get, onValue } from '../config/firebase.js';

class GameState {
    constructor() {
        this.user = null;
        this.coins = 0;
        this.level = 1;
        this.xp = 0;
        this.energy = 100;
        this.maxEnergy = 100;
        this.completedTasks = {};
        this.clickMultiplier = 1;
        this.lastUpdate = Date.now();
        this.listeners = new Set();
    }

    getLevelRequirement(level) {
        // Each level requires more XP: level * 100
        return level * 100;
    }

    async updateXP(amount) {
        const currentLevelReq = this.getLevelRequirement(this.level);
        this.xp += amount;

        // Level up if XP exceeds requirement
        while (this.xp >= currentLevelReq) {
            this.xp -= currentLevelReq;
            this.level++;
            this.onLevelUp();
        }

        await this.saveUserData({
            level: this.level,
            xp: this.xp
        });
    }

    onLevelUp() {
        // Increase click multiplier and max energy on level up
        this.clickMultiplier = 1 + (this.level * 0.1); // 10% increase per level
        this.maxEnergy += 10; // +10 max energy per level
        this.energy = this.maxEnergy; // Refill energy on level up
        
        // Show level up animation
        this.notifyListeners('levelUp');
    }

    async initialize() {
        try {
            if (!window.Telegram?.WebApp) {
                throw new Error('Telegram WebApp not available');
            }

            this.user = window.Telegram.WebApp.initDataUnsafe.user;
            if (!this.user?.username) {
                throw new Error('User not logged in');
            }

            await this.loadUserData();
            this.startEnergyRecharge();
            this.setupRealtimeUpdates();
            return true;
        } catch (error) {
            console.error('Initialization error:', error);
            return false;
        }
    }

    async loadUserData() {
        const userRef = ref(db, `users/${this.user.username}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val() || {};
        
        this.coins = userData.coins || 0;
        this.energy = userData.energy || 100;
        this.completedTasks = userData.completedTasks || {};
        this.clickMultiplier = userData.clickMultiplier || 1;
        this.notifyListeners();
    }

    setupRealtimeUpdates() {
        const userRef = ref(db, `users/${this.user.username}`);
        onValue(userRef, (snapshot) => {
            const userData = snapshot.val() || {};
            this.coins = userData.coins || this.coins;
            this.energy = userData.energy || this.energy;
            this.completedTasks = userData.completedTasks || this.completedTasks;
            this.clickMultiplier = userData.clickMultiplier || this.clickMultiplier;
            this.notifyListeners();
        });
    }

    async updateCoins(amount) {
        if (this.energy <= 0) return false;
        
        const newCoins = this.coins + (amount * this.clickMultiplier);
        const newEnergy = Math.max(0, this.energy - 1);
        
        await this.saveUserData({
            coins: newCoins,
            energy: newEnergy
        });

        return true;
    }

    async completeTask(taskId, reward) {
        if (this.completedTasks[taskId]) return false;

        const newCoins = this.coins + reward;
        this.completedTasks[taskId] = true;

        await this.saveUserData({
            coins: newCoins,
            completedTasks: this.completedTasks
        });

        return true;
    }

    startEnergyRecharge() {
        setInterval(() => {
            if (this.energy < this.maxEnergy) {
                const newEnergy = Math.min(this.maxEnergy, this.energy + 1);
                this.saveUserData({ energy: newEnergy });
            }
        }, 60000); // 1 minute
    }

    async saveUserData(updates) {
        if (!this.user?.username) return;

        const userRef = ref(db, `users/${this.user.username}`);
        await update(userRef, {
            ...updates,
            lastUpdate: Date.now()
        });
    }

    addListener(callback) {
        this.listeners.add(callback);
    }

    removeListener(callback) {
        this.listeners.delete(callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => callback(this));
    }
}

// Export singleton instance
export const gameState = new GameState(); 