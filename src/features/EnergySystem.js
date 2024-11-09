export class EnergySystem {
    constructor() {
        this.maxEnergy = 100;
        this.energy = parseInt(localStorage.getItem('energy')) || this.maxEnergy;
        this.regenRate = 1;
        this.regenInterval = 2000; // 2 seconds
        this.energyCost = 2;
        this.lastUpdate = parseInt(localStorage.getItem('lastEnergyUpdate')) || Date.now();
        this.timer = null;
        
        this.initialize();
    }

    initialize() {
        this.checkOfflineRegeneration();
        this.startRegeneration();
        this.updateUI();
    }

    useEnergy() {
        if (this.energy < this.energyCost) return false;
        
        this.energy = Math.max(0, this.energy - this.energyCost);
        this.save();
        this.updateUI();
        return true;
    }

    startRegeneration() {
        if (this.timer) clearInterval(this.timer);

        this.timer = setInterval(() => {
            if (this.energy < this.maxEnergy) {
                this.energy = Math.min(this.maxEnergy, this.energy + this.regenRate);
                this.save();
                this.updateUI();
            }
        }, this.regenInterval);
    }

    checkOfflineRegeneration() {
        const currentTime = Date.now();
        const timeDiff = currentTime - this.lastUpdate;
        const energyToAdd = Math.floor(timeDiff / this.regenInterval) * this.regenRate;

        if (energyToAdd > 0) {
            this.energy = Math.min(this.maxEnergy, this.energy + energyToAdd);
            this.save();
        }
    }

    updateUI() {
        const energyDisplay = document.getElementById('energy');
        const progressBar = document.querySelector('.progress');
        
        if (energyDisplay) {
            energyDisplay.textContent = Math.floor(this.energy);
        }

        if (progressBar) {
            const percentage = (this.energy / this.maxEnergy);
            progressBar.style.transform = `scaleX(${percentage})`;
            
            // Update color based on energy level
            if (this.energy < 30) {
                progressBar.style.background = 'linear-gradient(90deg, #ff4444, #ff6b6b)';
            } else if (this.energy < 70) {
                progressBar.style.background = 'linear-gradient(90deg, #ffa726, #ffb74d)';
            } else {
                progressBar.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
            }
        }
    }

    save() {
        localStorage.setItem('energy', this.energy.toString());
        localStorage.setItem('lastEnergyUpdate', Date.now().toString());
    }

    cleanup() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
} 