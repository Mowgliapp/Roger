import { UserManager } from './UserManager';

export class MowgliApp {
    constructor() {
        this.energy = 100;
        this.maxEnergy = 100;
        this.energyRegenRate = 2;
        this.energyRegenInterval = 1500;
        this.energyCost = 2;
        this.shakeThreshold = 5;
        this.points = 0;
        this.clickMultiplier = 2;
        
        // Initialize Telegram user
        this.telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        
        if (this.telegramUser?.username) {
            this.userManager = new UserManager(this.telegramUser.username);
            this.userManager.initializeUser();
            this.setupUserSync();
        }

        this.initialize();
    }

    setupUserSync() {
        this.userManager.onUserDataChange((userData) => {
            this.points = userData.coins || 0;
            this.energy = userData.energy || 100;
            this.updateUI();
        });
    }

    async handleInteraction(event) {
        if (this.energy < this.energyCost) {
            this.handleLowEnergy(event);
            return;
        }

        // Update energy and points
        this.energy = Math.max(0, this.energy - this.energyCost);
        this.points += this.clickMultiplier;

        // Create visual effects
        this.createFloatingPoints(event.clientX, event.clientY, this.clickMultiplier);
        this.createClickRipple(event.clientX, event.clientY);

        // Update UI and save state
        this.updateUI();
        await this.saveState();
    }

    async saveState() {
        if (this.userManager) {
            await Promise.all([
                this.userManager.updateCoins(this.points),
                this.userManager.updateEnergy(this.energy)
            ]);
        }
        
        // Backup to localStorage
        localStorage.setItem('coins', this.points.toString());
        localStorage.setItem('energy', this.energy.toString());
        localStorage.setItem('lastEnergyUpdate', Date.now().toString());
    }

    // ... (rest of your existing methods)
} 