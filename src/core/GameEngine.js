import { db, ref, get, set, update, onValue } from '../config/firebase.js';
import { TelegramManager } from './TelegramManager.js';

export class GameEngine {
    constructor() {
        this.user = null;
        this.coins = 0;
        this.level = 1;
        this.xp = 0;
        this.energy = 100;
        this.maxEnergy = 100;
        this.clickMultiplier = 1;
        this.lastClick = 0;
        this.clickCooldown = 50; // ms between clicks
        this.listeners = new Set();
        this.telegram = new TelegramManager();
    }

    async initialize() {
        try {
            // Initialize Telegram
            await this.telegram.initialize();
            this.user = this.telegram.getUser();
            
            if (!this.user?.username) {
                throw new Error('User not authenticated');
            }

            // Load user data
            await this.loadUserData();
            
            // Start energy regeneration
            this.startEnergyRegeneration();
            
            // Setup real-time updates
            this.setupRealtimeSync();

            return true;
        } catch (error) {
            console.error('GameEngine initialization failed:', error);
            return false;
        }
    }

    async loadUserData() {
        const userRef = ref(db, `users/${this.user.username}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val() || {};

        this.coins = userData.coins || 0;
        this.level = userData.level || 1;
        this.xp = userData.xp || 0;
        this.energy = userData.energy || 100;
        this.clickMultiplier = userData.clickMultiplier || 1;
        
        this.notifyListeners('dataUpdate');
    }

    setupRealtimeSync() {
        const userRef = ref(db, `users/${this.user.username}`);
        onValue(userRef, (snapshot) => {
            const userData = snapshot.val() || {};
            this.coins = userData.coins || this.coins;
            this.level = userData.level || this.level;
            this.xp = userData.xp || this.xp;
            this.energy = userData.energy || this.energy;
            this.clickMultiplier = userData.clickMultiplier || this.clickMultiplier;
            
            this.notifyListeners('dataUpdate');
        });
    }

    async handleClick() {
        const now = Date.now();
        if (now - this.lastClick < this.clickCooldown) return false;
        if (this.energy <= 0) return false;

        this.lastClick = now;
        
        // Calculate rewards
        const baseReward = 1;
        const reward = Math.floor(baseReward * this.clickMultiplier);
        
        // Update stats
        this.coins += reward;
        this.energy = Math.max(0, this.energy - 1);
        await this.addXP(1);

        // Save to Firebase
        await this.saveUserData();
        
        this.notifyListeners('click', { reward });
        return true;
    }

    async addXP(amount) {
        this.xp += amount;
        const requiredXP = this.getLevelRequirement();
        
        if (this.xp >= requiredXP) {
            this.xp -= requiredXP;
            this.level++;
            this.clickMultiplier = 1 + (this.level * 0.1);
            this.notifyListeners('levelUp');
        }
    }

    getLevelRequirement() {
        return this.level * 100;
    }

    startEnergyRegeneration() {
        setInterval(() => {
            if (this.energy < this.maxEnergy) {
                this.energy = Math.min(this.maxEnergy, this.energy + 1);
                this.saveUserData();
                this.notifyListeners('energyUpdate');
            }
        }, 60000); // 1 minute
    }

    async saveUserData() {
        if (!this.user?.username) return;

        const userData = {
            coins: this.coins,
            level: this.level,
            xp: this.xp,
            energy: this.energy,
            clickMultiplier: this.clickMultiplier,
            lastUpdate: Date.now()
        };

        await update(ref(db, `users/${this.user.username}`), userData);
    }

    addListener(callback) {
        this.listeners.add(callback);
    }

    removeListener(callback) {
        this.listeners.delete(callback);
    }

    notifyListeners(event, data = null) {
        this.listeners.forEach(callback => callback(event, data));
    }
} 