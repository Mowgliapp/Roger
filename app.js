import { db, ref, set, get } from './firebase.config.js';

class MowgliApp {
    constructor() {
        this.user = null;
        this.coins = 0;
        this.initialized = false;
    }

    async initialize() {
        try {
            // Initialize Telegram
            if (!window.Telegram || !window.Telegram.WebApp) {
                console.error('Telegram WebApp not available');
                return false;
            }

            Telegram.WebApp.ready();
            this.user = Telegram.WebApp.initDataUnsafe.user;

            if (!this.user || !this.user.username) {
                console.error('User not logged in');
                return false;
            }

            // Initialize user data
            await this.initializeUserData();
            this.initialized = true;

            // Setup UI updates
            this.setupUIHandlers();
            return true;
        } catch (error) {
            console.error('Initialization error:', error);
            return false;
        }
    }

    async initializeUserData() {
        const userRef = ref(db, `users/${this.user.username}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val() || { coins: 0, completedTasks: {} };

        this.coins = userData.coins || 0;
        this.completedTasks = userData.completedTasks || {};
        
        // Update UI
        this.updateUI();
    }

    async updateCoins(amount) {
        try {
            if (!this.initialized || !this.user?.username) return;

            const newTotal = this.coins + amount;
            const userRef = ref(db, `users/${this.user.username}`);
            
            // Update Firebase with direct number value
            await set(userRef, {
                coins: newTotal,
                lastUpdated: new Date().toISOString()
            });

            this.coins = newTotal;
            this.updateUI();
            return true;
        } catch (error) {
            console.error('Error updating coins:', error);
            return false;
        }
    }

    async completeTask(taskId, reward) {
        try {
            if (!this.initialized) return false;
            if (this.completedTasks[taskId]) {
                alert('Task already completed!');
                return false;
            }

            // Update coins and mark task as completed
            this.completedTasks[taskId] = true;
            await this.updateCoins(reward);
            
            // Update UI
            const taskButton = document.getElementById(taskId);
            if (taskButton) {
                taskButton.classList.add('completed');
                taskButton.onclick = null;
                taskButton.innerHTML += '<span class="completed-badge">✓ Completed</span>';
            }

            alert(`Congratulations! You earned ${reward} coins!`);
            return true;
        } catch (error) {
            console.error('Error completing task:', error);
            return false;
        }
    }

    updateUI() {
        const pointsDisplay = document.getElementById('points');
        if (pointsDisplay) {
            // Ensure clean number display
            pointsDisplay.textContent = Math.floor(this.coins);
        }
    }

    setupUIHandlers() {
        // Coin click handler
        const coinElement = document.getElementById('coin');
        if (coinElement) {
            coinElement.addEventListener('click', async () => {
                await this.updateCoins(1);
            });
        }

        // Periodic UI updates
        setInterval(() => this.updateUI(), 5000);
    }
}

// Export singleton instance
export const mowgliApp = new MowgliApp(); 