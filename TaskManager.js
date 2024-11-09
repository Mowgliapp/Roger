import { ref, get, update, onValue, set } from 'firebase/database';
import { getDatabase } from 'firebase/database';
import { NotificationManager } from './NotificationManager';

export class TaskManager {
    constructor(userManager) {
        this.userManager = userManager;
        this.db = getDatabase();
        this.notificationManager = new NotificationManager();
        
        // Task configurations
        this.taskConfigs = {
            daily: [
                {
                    id: 'daily_login',
                    title: 'Daily Login',
                    description: 'Login to the game daily',
                    reward: 100,
                    icon: 'fa-calendar-check',
                    type: 'daily',
                    isActive: true
                },
                {
                    id: 'daily_clicks',
                    title: 'Complete 5 Clicks',
                    description: 'Coming Soon',
                    reward: 150,
                    icon: 'fa-mouse-pointer',
                    type: 'daily',
                    isLocked: true,
                    lockIcon: 'fa-lock'
                }
            ]
        };

        this.initialize();
    }

    async initialize() {
        if (!this.userManager?.username) {
            console.error('User not initialized');
            return;
        }

        // Check and reset daily tasks at midnight
        this.checkDailyReset();
        
        // Set up daily reset interval
        setInterval(() => this.checkDailyReset(), 60000); // Check every minute
        
        // Initialize daily login check
        await this.checkDailyLogin();

        // Update timer every second
        setInterval(() => this.updateResetTimer(), 1000);
        this.updateResetTimer(); // Initial update
    }

    async checkDailyReset() {
        const now = new Date();
        const lastReset = new Date(localStorage.getItem('lastDailyReset') || 0);
        
        if (lastReset.getDate() !== now.getDate()) {
            await this.resetDailyTasks();
            localStorage.setItem('lastDailyReset', now.toISOString());
        }
    }

    async resetDailyTasks() {
        try {
            const userTasksRef = ref(this.db, `users/${this.userManager.username}/tasks/daily`);
            await set(userTasksRef, {
                lastReset: Date.now(),
                completed: []
            });
            
            // Reset local storage for daily tasks
            localStorage.setItem('completedTasks', JSON.stringify([]));
            
            // Update UI
            this.updateTasksUI();
        } catch (error) {
            console.error('Error resetting daily tasks:', error);
            this.notificationManager.show('Failed to reset daily tasks', 'error');
        }
    }

    async checkDailyLogin() {
        const today = new Date().toDateString();
        const lastLogin = localStorage.getItem('lastLoginDate');
        
        if (lastLogin !== today) {
            // Award daily login reward
            await this.completeDailyLogin();
            localStorage.setItem('lastLoginDate', today);
            
            // Show welcome back message
            this.showWelcomeBack();
        }
    }

    async completeDailyLogin() {
        const task = this.taskConfigs.daily.find(t => t.id === 'daily_login');
        if (!task) return;

        try {
            // Update Firebase
            const userTaskRef = ref(this.db, `users/${this.userManager.username}/tasks/daily/completed`);
            const snapshot = await get(userTaskRef);
            const completedTasks = snapshot.val() || [];
            
            if (!completedTasks.includes('daily_login')) {
                completedTasks.push('daily_login');
                await set(userTaskRef, completedTasks);
                
                // Award coins
                await this.userManager.addCoins(task.reward);
                
                // Update streak
                await this.updateLoginStreak();
                
                // Show completion notification
                this.notificationManager.show(
                    `Daily Login Reward: +${task.reward} coins! 🎉`,
                    'success'
                );
                
                // Update UI
                this.updateTasksUI();
            }
        } catch (error) {
            console.error('Error completing daily login:', error);
            this.notificationManager.show(
                'Failed to process daily login reward',
                'error'
            );
        }
    }

    async updateLoginStreak() {
        const today = new Date().toDateString();
        const lastLogin = localStorage.getItem('lastLoginDate');
        const currentStreak = parseInt(localStorage.getItem('loginStreak') || '0');
        
        if (lastLogin === new Date(Date.now() - 86400000).toDateString()) {
            // Yesterday - increment streak
            const newStreak = currentStreak + 1;
            localStorage.setItem('loginStreak', newStreak.toString());
        } else if (lastLogin !== today) {
            // Streak broken
            localStorage.setItem('loginStreak', '1');
        }
    }

    showWelcomeBack() {
        const streak = parseInt(localStorage.getItem('loginStreak') || '1');
        const notification = document.createElement('div');
        notification.className = 'welcome-notification';
        
        notification.innerHTML = `
            <div class="welcome-content">
                <h3>Welcome Back! 👋</h3>
                <p>Your daily login streak: ${streak} days</p>
                <div class="streak-bonus">
                    <img src="assets/images/coin.gif" width="20" height="20" alt="coins">
                    <span>+${this.calculateStreakBonus(streak)} bonus coins</span>
                </div>
            </div>
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    calculateStreakBonus(streak) {
        return Math.min(100 * streak, 1000); // Cap at 1000 coins
    }

    isTaskCompleted(taskId) {
        const completedTasks = JSON.parse(localStorage.getItem('completedTasks') || '[]');
        return completedTasks.includes(taskId);
    }

    async updateTasksUI() {
        const tasksContainer = document.getElementById('daily-tasks');
        if (!tasksContainer) return;

        tasksContainer.innerHTML = '';
        
        for (const task of this.taskConfigs.daily) {
            const taskElement = this.createTaskElement(task);
            tasksContainer.appendChild(taskElement);
        }
    }

    createTaskElement(task) {
        const isCompleted = this.isTaskCompleted(task.id);
        const taskElement = document.createElement('div');
        taskElement.className = `slide-task-item ${task.isLocked ? 'locked' : ''} ${isCompleted ? 'completed' : ''}`;
        taskElement.dataset.taskId = task.id;

        taskElement.innerHTML = `
            <div class="task-info">
                <div class="task-title">
                    <i class="fas ${task.icon}"></i>
                    ${task.title}
                </div>
                <div class="task-description">
                    ${task.isLocked ? `
                        <i class="fas ${task.lockIcon}"></i>
                        ${task.description}
                    ` : task.description}
                </div>
            </div>
            <div class="task-reward ${task.isLocked ? 'locked' : ''}">
                <span class="reward-amount">+${task.reward}</span>
                <img src="assets/images/coin.gif" width="20" height="20" alt="coins">
            </div>
            ${this.createTaskButton(task, isCompleted)}
        `;

        return taskElement;
    }

    createTaskButton(task, isCompleted) {
        if (task.isLocked) {
            return `
                <button class="task-claim-button locked" disabled>
                    <i class="fas fa-lock"></i>
                    <span>Coming Soon</span>
                </button>
            `;
        }

        if (isCompleted) {
            return `
                <button class="task-claim-button completed" disabled>
                    <i class="fas fa-check"></i>
                    <span>Claimed</span>
                </button>
            `;
        }

        return `
            <button class="task-claim-button ready" onclick="window.taskManager.handleTaskClaim('${task.id}')">
                <i class="fas fa-gift"></i>
                <span>Claim</span>
            </button>
        `;
    }

    async handleTaskClaim(taskId) {
        const task = this.taskConfigs.daily.find(t => t.id === taskId);
        if (!task || task.isLocked || this.isTaskCompleted(taskId)) return;

        try {
            await this.completeDailyLogin();
        } catch (error) {
            console.error('Error claiming task:', error);
            this.notificationManager.show('Failed to claim reward', 'error');
        }
    }

    updateResetTimer() {
        const timerElement = document.getElementById('dailyResetTimer');
        if (!timerElement) return;

        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const timeLeft = tomorrow - now;
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        timerElement.textContent = `Resets in: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    async saveTaskCompletion(taskId, taskType) {
        try {
            const userTaskRef = ref(this.db, `users/${this.userManager.username}/tasks/${taskType}/completed`);
            const snapshot = await get(userTaskRef);
            const completedTasks = snapshot.val() || [];
            
            if (!completedTasks.includes(taskId)) {
                completedTasks.push(taskId);
                await set(userTaskRef, completedTasks);
                
                // Update last completion time for daily tasks
                if (taskType === 'daily') {
                    await update(ref(this.db, `users/${this.userManager.username}/tasks/daily`), {
                        lastCompletion: Date.now()
                    });
                }
            }
        } catch (error) {
            console.error('Error saving task completion:', error);
            throw error;
        }
    }

    async loadTaskProgress() {
        try {
            const userTasksRef = ref(this.db, `users/${this.userManager.username}/tasks`);
            const snapshot = await get(userTasksRef);
            
            if (snapshot.exists()) {
                const tasksData = snapshot.val();
                return {
                    daily: tasksData.daily?.completed || [],
                    social: tasksData.social?.completed || [],
                    achievement: tasksData.achievement?.completed || []
                };
            }
            return {
                daily: [],
                social: [],
                achievement: []
            };
        } catch (error) {
            console.error('Error loading task progress:', error);
            throw error;
        }
    }
}

// Make taskManager globally available
window.taskManager = null;

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    const userManager = window.userManager; // Assume UserManager is already initialized
    if (userManager) {
        window.taskManager = new TaskManager(userManager);
    }
});