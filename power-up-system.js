class PowerUpSystem {
    constructor() {
        this.powerUps = {
            doubleCoins: {
                id: 'doubleCoins',
                name: 'Double Coins',
                description: 'Doubles coin earnings for 5 minutes',
                duration: 300, // 5 minutes in seconds
                icon: 'assets/images/powerups/double-coins.png',
                multiplier: 2,
                price: 5000
            },
            autoClick: {
                id: 'autoClick',
                name: 'Auto Clicker',
                description: 'Automatically clicks 2 times per second for 3 minutes',
                duration: 180,
                icon: 'assets/images/powerups/auto-click.png',
                clicksPerSecond: 2,
                price: 3000
            },
            energyBoost: {
                id: 'energyBoost',
                name: 'Energy Boost',
                description: 'Reduces energy consumption by 50% for 10 minutes',
                duration: 600,
                icon: 'assets/images/powerups/energy-boost.png',
                energyReduction: 0.5,
                price: 4000
            },
            xpBoost: {
                id: 'xpBoost',
                name: 'XP Boost',
                description: 'Earn double XP for 5 minutes',
                duration: 300,
                icon: 'assets/images/powerups/xp-boost.png',
                multiplier: 2,
                price: 6000
            }
        };

        this.activePowerUps = new Map();
        this.inventory = JSON.parse(localStorage.getItem('powerUpInventory')) || {};
        this.initialize();
    }

    initialize() {
        this.loadActivePowerUps();
        this.updateUI();
        this.startPowerUpTimer();
    }

    loadActivePowerUps() {
        const savedPowerUps = JSON.parse(localStorage.getItem('activePowerUps')) || {};
        for (const [id, data] of Object.entries(savedPowerUps)) {
            if (data.expiresAt > Date.now()) {
                this.activePowerUps.set(id, {
                    ...this.powerUps[id],
                    expiresAt: data.expiresAt
                });
            }
        }
    }

    savePowerUps() {
        const powerUpsData = {};
        this.activePowerUps.forEach((powerUp, id) => {
            powerUpsData[id] = {
                expiresAt: powerUp.expiresAt
            };
        });
        localStorage.setItem('activePowerUps', JSON.stringify(powerUpsData));
        localStorage.setItem('powerUpInventory', JSON.stringify(this.inventory));
    }

    addToInventory(powerUpId, quantity = 1) {
        this.inventory[powerUpId] = (this.inventory[powerUpId] || 0) + quantity;
        this.savePowerUps();
        this.updateUI();
    }

    usePowerUp(powerUpId) {
        if (!this.inventory[powerUpId] || this.inventory[powerUpId] <= 0) {
            return false;
        }

        if (this.activePowerUps.has(powerUpId)) {
            // Extend duration if already active
            const currentPowerUp = this.activePowerUps.get(powerUpId);
            currentPowerUp.expiresAt += this.powerUps[powerUpId].duration * 1000;
        } else {
            // Activate new power-up
            this.activePowerUps.set(powerUpId, {
                ...this.powerUps[powerUpId],
                expiresAt: Date.now() + (this.powerUps[powerUpId].duration * 1000)
            });
        }

        this.inventory[powerUpId]--;
        this.savePowerUps();
        this.updateUI();
        this.applyPowerUpEffects(powerUpId);

        // Play activation sound and show notification
        soundManager.play('powerup');
        notificationManager.showNotification(
            'Power-up Activated!',
            {
                body: `${this.powerUps[powerUpId].name} is now active!`,
                icon: this.powerUps[powerUpId].icon
            }
        );

        return true;
    }

    applyPowerUpEffects(powerUpId) {
        switch (powerUpId) {
            case 'autoClick':
                this.startAutoClicker();
                break;
            case 'doubleCoins':
                // Handled by getActiveMultiplier()
                break;
            case 'energyBoost':
                // Handled by getEnergyReduction()
                break;
            case 'xpBoost':
                // Handled by getXPMultiplier()
                break;
        }
    }

    startAutoClicker() {
        if (this.autoClickInterval) {
            clearInterval(this.autoClickInterval);
        }

        this.autoClickInterval = setInterval(() => {
            const powerUp = this.activePowerUps.get('autoClick');
            if (powerUp && powerUp.expiresAt > Date.now()) {
                for (let i = 0; i < powerUp.clicksPerSecond; i++) {
                    mowgliApp.updateCoins(this.getActiveMultiplier());
                }
            } else {
                clearInterval(this.autoClickInterval);
            }
        }, 1000);
    }

    getActiveMultiplier() {
        let multiplier = 1;
        if (this.activePowerUps.has('doubleCoins')) {
            const powerUp = this.activePowerUps.get('doubleCoins');
            if (powerUp.expiresAt > Date.now()) {
                multiplier *= powerUp.multiplier;
            }
        }
        return multiplier;
    }

    getEnergyReduction() {
        if (this.activePowerUps.has('energyBoost')) {
            const powerUp = this.activePowerUps.get('energyBoost');
            if (powerUp.expiresAt > Date.now()) {
                return powerUp.energyReduction;
            }
        }
        return 1;
    }

    getXPMultiplier() {
        if (this.activePowerUps.has('xpBoost')) {
            const powerUp = this.activePowerUps.get('xpBoost');
            if (powerUp.expiresAt > Date.now()) {
                return powerUp.multiplier;
            }
        }
        return 1;
    }

    startPowerUpTimer() {
        setInterval(() => {
            let updated = false;
            this.activePowerUps.forEach((powerUp, id) => {
                if (powerUp.expiresAt <= Date.now()) {
                    this.activePowerUps.delete(id);
                    updated = true;
                    
                    notificationManager.showNotification(
                        'Power-up Expired',
                        {
                            body: `${powerUp.name} has expired!`,
                            icon: powerUp.icon
                        }
                    );
                }
            });
            if (updated) {
                this.savePowerUps();
                this.updateUI();
            }
        }, 1000);
    }

    updateUI() {
        this.updateInventoryUI();
        this.updateShopUI();
        this.updateActivePowerUpsUI();
    }

    updateInventoryUI() {
        const inventoryContainer = document.getElementById('powerup-inventory');
        if (!inventoryContainer) return;

        let html = '';
        for (const [id, powerUp] of Object.entries(this.powerUps)) {
            const quantity = this.inventory[id] || 0;
            html += `
                <div class="powerup-item ${quantity > 0 ? 'available' : ''}">
                    <img src="${powerUp.icon}" alt="${powerUp.name}">
                    <div class="powerup-info">
                        <h4>${powerUp.name}</h4>
                        <p>${powerUp.description}</p>
                        <div class="powerup-quantity">Owned: ${quantity}</div>
                        ${quantity > 0 ? 
                            `<button onclick="powerUpSystem.usePowerUp('${id}')">Use</button>` :
                            ''
                        }
                    </div>
                </div>
            `;
        }
        inventoryContainer.innerHTML = html;
    }

    updateShopUI() {
        const shopContainer = document.getElementById('powerup-shop');
        if (!shopContainer) return;

        let html = '';
        for (const [id, powerUp] of Object.entries(this.powerUps)) {
            html += `
                <div class="powerup-shop-item">
                    <img src="${powerUp.icon}" alt="${powerUp.name}">
                    <div class="powerup-shop-info">
                        <h4>${powerUp.name}</h4>
                        <p>${powerUp.description}</p>
                        <div class="powerup-price">${powerUp.price} coins</div>
                        <button onclick="powerUpSystem.purchasePowerUp('${id}')"
                                ${mowgliApp.coins < powerUp.price ? 'disabled' : ''}>
                            Buy
                        </button>
                    </div>
                </div>
            `;
        }
        shopContainer.innerHTML = html;
    }

    updateActivePowerUpsUI() {
        const activeContainer = document.getElementById('active-powerups');
        if (!activeContainer) return;

        let html = '';
        this.activePowerUps.forEach((powerUp, id) => {
            const timeLeft = Math.max(0, Math.ceil((powerUp.expiresAt - Date.now()) / 1000));
            html += `
                <div class="active-powerup">
                    <img src="${powerUp.icon}" alt="${powerUp.name}">
                    <div class="powerup-timer">${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}</div>
                </div>
            `;
        });
        activeContainer.innerHTML = html;
    }

    purchasePowerUp(powerUpId) {
        const powerUp = this.powerUps[powerUpId];
        if (mowgliApp.coins >= powerUp.price) {
            mowgliApp.updateCoins(-powerUp.price);
            this.addToInventory(powerUpId);
            soundManager.play('purchase');
            return true;
        }
        return false;
    }
}

export const powerUpSystem = new PowerUpSystem(); 