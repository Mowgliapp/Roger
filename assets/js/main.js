class MowgliApp {
    constructor() {
        // Energy system initialization with faster regeneration
        this.energy = parseInt(localStorage.getItem('energy')) || 100;
        this.maxEnergy = 100;
        this.energyRegenRate = 2; // Increased from 1 to 2
        this.energyRegenInterval = 1500; // Decreased from 2000 to 1500
        this.energyCost = 2;
        this.shakeThreshold = 5; // New property for shake threshold
        this.lastEnergyUpdate = parseInt(localStorage.getItem('lastEnergyUpdate')) || Date.now();
        this.energyTimer = null;

        // Points system
        this.points = parseInt(localStorage.getItem('coins')) || 0;
        this.clickMultiplier = 2;

        this.initialize();
    }

    initialize() {
        this.checkOfflineEnergy();
        this.startEnergyTimer();
        this.setupEventListeners();
        this.updateUI();

        // Add touch event listener to stop shaking when touching anywhere
        document.addEventListener('touchstart', () => {
            if (document.body.classList.contains('intensive-shake')) {
                document.body.classList.remove('intensive-shake');
                
                // Add a timeout to resume shaking if energy is still low
                setTimeout(() => {
                    if (this.energy < this.energyCost) {
                        document.body.classList.add('intensive-shake');
                    }
                }, 1000);
            }
        });
    }

    checkOfflineEnergy() {
        const now = Date.now();
        const timePassed = now - this.lastEnergyUpdate;
        // Adjust offline regeneration to match new speed
        const energyRecovered = Math.floor((timePassed / this.energyRegenInterval) * this.energyRegenRate);
        
        this.energy = Math.min(this.maxEnergy, this.energy + energyRecovered);
        this.lastEnergyUpdate = now;
        
        localStorage.setItem('energy', this.energy.toString());
        localStorage.setItem('lastEnergyUpdate', now.toString());
    }

    startEnergyTimer() {
        if (this.energyTimer) clearInterval(this.energyTimer);
        
        this.energyTimer = setInterval(() => {
            if (this.energy < this.maxEnergy) {
                this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegenRate);
                this.updateUI();
                localStorage.setItem('energy', this.energy.toString());
                localStorage.setItem('lastEnergyUpdate', Date.now().toString());
            }
        }, this.energyRegenInterval);
    }

    setupEventListeners() {
        const clickArea = document.getElementById('coin');
        const character = document.querySelector('.main-character');
        if (!clickArea || !character) return;

        // Touch start handler
        clickArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            character.classList.add('vibrating');
            this.handleInteraction(e.touches[0]);
        }, { passive: false });

        // Touch end handler
        clickArea.addEventListener('touchend', () => {
            character.classList.remove('vibrating');
        });

        // Click handler
        clickArea.addEventListener('click', (e) => {
            if (e.pointerType === 'touch') return;
            character.classList.add('vibrating');
            this.handleInteraction(e);
            setTimeout(() => {
                character.classList.remove('vibrating');
            }, 100);
        });
    }

    handleInteraction(event) {
        // Check if there's enough energy
        if (this.energy < this.energyCost) {
            // If not already shaking, start intensive shake
            if (!document.body.classList.contains('intensive-shake')) {
                document.body.classList.add('intensive-shake');
                
                // Add vibration pattern if supported
                if (navigator.vibrate) {
                    navigator.vibrate([100, 50, 100, 50, 100]);
                }
            }
            
            this.createFloatingError(event.clientX, event.clientY);
            return;
        }

        // If we have energy, remove shake effect
        document.body.classList.remove('intensive-shake');

        // Deduct energy first
        this.energy = Math.max(0, this.energy - this.energyCost);
        
        // Check if this deduction resulted in zero energy
        if (this.energy <= this.energyCost) {
            this.createFloatingError(event.clientX, event.clientY);
            
            // Enhanced visual feedback
            const character = document.querySelector('.main-character');
            if (character) {
                character.classList.add('energy-depleted');
                setTimeout(() => character.classList.remove('energy-depleted'), 1000);
            }
        } else {
            // Enhanced points animation
            this.points += this.clickMultiplier;
            
            // Handle points cycling with visual feedback
            if (this.points >= this.maxPoints) {
                this.points = 0;
                this.createLevelUpEffect();
            }
            
            this.createFloatingPoints(event.clientX, event.clientY, this.clickMultiplier);
            
            // Add click ripple effect
            this.createClickRipple(event.clientX, event.clientY);
        }
        
        this.updateUI();
        this.saveState();
    }

    createFloatingPoints(x, y, amount) {
        const floatingText = document.createElement('div');
        floatingText.className = 'floating-click';
        floatingText.textContent = `+${amount}`;
        floatingText.style.left = `${x}px`;
        floatingText.style.top = `${y}px`;
        document.body.appendChild(floatingText);

        setTimeout(() => floatingText.remove(), 1500);
    }

    createFloatingError(x, y) {
        const messages = ['No Energy!'];  // Reduced to just one message
        
        // Create only one box with a nicer effect
        const floatingBox = document.createElement('div');
        floatingBox.className = 'floating-error';
        
        // Add text to the box
        const textSpan = document.createElement('span');
        textSpan.textContent = messages[0];
        floatingBox.appendChild(textSpan);
        
        // Center the box on click position
        floatingBox.style.left = `${x - 30}px`; // Adjust for box width
        floatingBox.style.top = `${y - 15}px`;  // Adjust for box height
        
        document.body.appendChild(floatingBox);
        setTimeout(() => floatingBox.remove(), 1500);
    }

    createClickRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.className = 'click-ripple';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 1000);
    }

    createLevelUpEffect() {
        const effect = document.createElement('div');
        effect.className = 'level-cycle-effect';
        document.body.appendChild(effect);
        setTimeout(() => effect.remove(), 1500);
    }

    updateUI() {
        // Update points and energy displays
        const pointsElement = document.getElementById('points');
        if (pointsElement) {
            pointsElement.textContent = this.points;
        }

        const energyElement = document.getElementById('energy');
        if (energyElement) {
            energyElement.textContent = Math.floor(this.energy);
        }

        // Update progress bar
        const progressBar = document.querySelector('.progress');
        if (progressBar) {
            const percentage = this.energy / this.maxEnergy;
            progressBar.style.transform = `scaleX(${percentage})`;

            // Update color based on energy level
            if (this.energy < 30) {
                progressBar.className = 'progress low';
            } else if (this.energy < 70) {
                progressBar.className = 'progress medium';
            } else {
                progressBar.className = 'progress';
            }
        }

        // Check energy level for shake effect
        if (this.energy < this.shakeThreshold) {
            if (!document.body.classList.contains('intensive-shake')) {
                document.body.classList.add('intensive-shake');
                // Add vibration if supported
                if (navigator.vibrate) {
                    navigator.vibrate([100, 50, 100]);
                }
            }
        } else {
            document.body.classList.remove('intensive-shake');
        }
    }

    saveState() {
        localStorage.setItem('energy', this.energy.toString());
        localStorage.setItem('lastEnergyUpdate', Date.now().toString());
        localStorage.setItem('coins', this.points.toString());
    }

    cleanup() {
        if (this.energyTimer) {
            clearInterval(this.energyTimer);
        }
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    window.mowgliApp = new MowgliApp();
});

// Cleanup on page unload
window.addEventListener('unload', () => {
    if (window.mowgliApp) {
        window.mowgliApp.cleanup();
    }
});