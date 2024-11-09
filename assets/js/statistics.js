import { mowgliApp } from './main.js';

class StatisticsManager {
    constructor() {
        this.stats = {
            totalClicks: 0,
            totalCoins: 0,
            totalTasks: 0,
            totalReferrals: 0,
            totalAchievements: 0,
            totalPlaytime: 0
        };
        this.initialize();
    }

    initialize() {
        this.loadStats();
        this.updateUI();
        this.startPlaytimeCounter();
    }

    loadStats() {
        // Load stats from localStorage
        this.stats.totalClicks = parseInt(localStorage.getItem('totalClicks')) || 0;
        this.stats.totalCoins = mowgliApp.coins;
        this.stats.totalTasks = Object.keys(mowgliApp.completedTasks).length;
        this.stats.totalReferrals = parseInt(localStorage.getItem('totalReferrals')) || 0;
        this.stats.totalAchievements = this.countAchievements();
        this.stats.totalPlaytime = parseInt(localStorage.getItem('totalPlaytime')) || 0;
    }

    countAchievements() {
        return Object.keys(mowgliApp.completedTasks).filter(taskId => 
            taskId.startsWith('achieve')).length;
    }

    updateUI() {
        // Update all statistics displays
        const elements = {
            'total-clicks': this.stats.totalClicks,
            'total-coins': this.stats.totalCoins,
            'total-tasks': this.stats.totalTasks,
            'total-referrals': this.stats.totalReferrals,
            'total-achievements': this.stats.totalAchievements,
            'total-playtime': this.formatPlaytime(this.stats.totalPlaytime)
        };

        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        }
    }

    formatPlaytime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }

    startPlaytimeCounter() {
        // Update playtime every minute
        setInterval(() => {
            this.stats.totalPlaytime++;
            localStorage.setItem('totalPlaytime', this.stats.totalPlaytime);
            this.updateUI();
        }, 60000);
    }

    incrementStat(stat) {
        if (stat in this.stats) {
            this.stats[stat]++;
            localStorage.setItem(stat, this.stats[stat]);
            this.updateUI();
        }
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.statisticsManager = new StatisticsManager();
}); 