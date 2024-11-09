export class UIManager {
    constructor(gameEngine) {
        this.game = gameEngine;
        this.elements = {};
        this.animations = new Set();
        this.clickCooldown = false;
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        // Cache DOM elements
        this.elements = {
            points: document.getElementById('points'),
            level: document.getElementById('current-level'),
            xpCounter: document.getElementById('xp-counter'),
            xpProgress: document.getElementById('xp-progress'),
            character: document.getElementById('coin'),
            energyCount: document.getElementById('energy-count'),
            energyIndicator: document.getElementById('energy-indicator'),
            container: document.querySelector('.coin-container')
        };
    }

    setupEventListeners() {
        // Character click handler
        if (this.elements.character) {
            this.elements.character.addEventListener('click', async (event) => {
                if (this.clickCooldown) return;
                
                const success = await this.game.handleClick();
                if (success) {
                    this.createClickEffect(event);
                    this.playClickAnimation();
                } else {
                    this.showEnergyWarning();
                }
            });
        }

        // Game state listeners
        this.game.addListener((event, data) => {
            switch (event) {
                case 'click':
                    this.updatePoints();
                    this.updateEnergy();
                    break;
                case 'levelUp':
                    this.showLevelUpAnimation();
                    this.updateLevel();
                    break;
                case 'energyUpdate':
                    this.updateEnergy();
                    break;
                case 'dataUpdate':
                    this.updateAllUI();
                    break;
            }
        });
    }

    createClickEffect(event) {
        // Create floating points
        const floatingPoint = document.createElement('div');
        floatingPoint.className = 'floating-point';
        floatingPoint.textContent = `+${Math.floor(this.game.clickMultiplier)}`;

        // Position at click coordinates
        const rect = this.elements.container.getBoundingClientRect();
        floatingPoint.style.left = `${event.clientX - rect.left}px`;
        floatingPoint.style.top = `${event.clientY - rect.top}px`;

        this.elements.container.appendChild(floatingPoint);

        // Create ripple effect
        const ripple = document.createElement('div');
        ripple.className = 'click-ripple';
        ripple.style.left = `${event.clientX - rect.left}px`;
        ripple.style.top = `${event.clientY - rect.top}px`;
        this.elements.container.appendChild(ripple);

        // Cleanup
        setTimeout(() => {
            floatingPoint.remove();
            ripple.remove();
        }, 1000);
    }

    playClickAnimation() {
        if (this.clickCooldown) return;
        
        this.clickCooldown = true;
        this.elements.character.classList.add('click-animation');
        
        setTimeout(() => {
            this.elements.character.classList.remove('click-animation');
            this.clickCooldown = false;
        }, 100);
    }

    showLevelUpAnimation() {
        const levelUp = document.createElement('div');
        levelUp.className = 'level-up-animation';
        levelUp.innerHTML = `
            <div class="level-up-content">
                <span class="level-up-text">LEVEL UP!</span>
                <span class="level-number">${this.game.level}</span>
            </div>
        `;

        document.body.appendChild(levelUp);

        setTimeout(() => levelUp.remove(), 2000);
    }

    showEnergyWarning() {
        if (!this.elements.energyIndicator.classList.contains('warning')) {
            this.elements.energyIndicator.classList.add('warning');
            setTimeout(() => {
                this.elements.energyIndicator.classList.remove('warning');
            }, 500);
        }
    }

    updatePoints() {
        if (this.elements.points) {
            this.elements.points.textContent = Math.floor(this.game.coins);
        }
    }

    updateLevel() {
        if (this.elements.level) {
            this.elements.level.textContent = this.game.level;
        }
        if (this.elements.xpCounter) {
            const req = this.game.getLevelRequirement();
            this.elements.xpCounter.textContent = `${this.game.xp}/${req} XP`;
        }
        if (this.elements.xpProgress) {
            const percentage = (this.game.xp / this.game.getLevelRequirement()) * 100;
            this.elements.xpProgress.style.width = `${percentage}%`;
        }
    }

    updateEnergy() {
        if (this.elements.energyCount) {
            this.elements.energyCount.textContent = Math.floor(this.game.energy);
        }
        if (this.elements.energyIndicator) {
            this.elements.energyIndicator.textContent = Math.floor(this.game.energy);
        }
    }

    updateAllUI() {
        this.updatePoints();
        this.updateLevel();
        this.updateEnergy();
    }
} 