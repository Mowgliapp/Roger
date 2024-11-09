import { mowgliApp } from './main.js';

class SettingsManager {
    constructor() {
        this.settings = {
            soundEffects: true,
            volume: 50,
            notifications: true,
            language: 'en',
            darkMode: true,
            colorScheme: 'default',
            autoClick: false,
            vibration: true
        };
        this.initialize();
    }

    initialize() {
        this.loadSettings();
        this.setupEventListeners();
        this.applySettings();
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
    }

    saveSettings() {
        localStorage.setItem('userSettings', JSON.stringify(this.settings));
        this.applySettings();
    }

    setupEventListeners() {
        // Sound Effects Toggle
        const soundEffects = document.getElementById('sound-effects');
        if (soundEffects) {
            soundEffects.checked = this.settings.soundEffects;
            soundEffects.addEventListener('change', (e) => {
                this.settings.soundEffects = e.target.checked;
                this.saveSettings();
            });
        }

        // Volume Slider
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.value = this.settings.volume;
            volumeSlider.addEventListener('input', (e) => {
                this.settings.volume = e.target.value;
                this.saveSettings();
            });
        }

        // Notifications Toggle
        const notifications = document.getElementById('notifications');
        if (notifications) {
            notifications.checked = this.settings.notifications;
            notifications.addEventListener('change', (e) => {
                this.settings.notifications = e.target.checked;
                this.saveSettings();
                this.requestNotificationPermission();
            });
        }

        // Language Select
        const language = document.getElementById('language');
        if (language) {
            language.value = this.settings.language;
            language.addEventListener('change', (e) => {
                this.settings.language = e.target.value;
                this.saveSettings();
                this.updateLanguage();
            });
        }

        // Dark Mode Toggle
        const darkMode = document.getElementById('dark-mode');
        if (darkMode) {
            darkMode.checked = this.settings.darkMode;
            darkMode.addEventListener('change', (e) => {
                this.settings.darkMode = e.target.checked;
                this.saveSettings();
                this.updateTheme();
            });
        }

        // Color Scheme Select
        const colorScheme = document.getElementById('color-scheme');
        if (colorScheme) {
            colorScheme.value = this.settings.colorScheme;
            colorScheme.addEventListener('change', (e) => {
                this.settings.colorScheme = e.target.value;
                this.saveSettings();
                this.updateColorScheme();
            });
        }

        // Auto Click Toggle
        const autoClick = document.getElementById('auto-click');
        if (autoClick) {
            autoClick.checked = this.settings.autoClick;
            autoClick.addEventListener('change', (e) => {
                this.settings.autoClick = e.target.checked;
                this.saveSettings();
                this.toggleAutoClick();
            });
        }

        // Vibration Toggle
        const vibration = document.getElementById('vibration');
        if (vibration) {
            vibration.checked = this.settings.vibration;
            vibration.addEventListener('change', (e) => {
                this.settings.vibration = e.target.checked;
                this.saveSettings();
            });
        }

        // Reset Settings Button
        const resetButton = document.getElementById('reset-settings');
        if (resetButton) {
            resetButton.addEventListener('click', () => this.resetSettings());
        }
    }

    applySettings() {
        this.updateTheme();
        this.updateColorScheme();
        this.updateLanguage();
        this.toggleAutoClick();
    }

    updateTheme() {
        document.body.classList.toggle('dark-mode', this.settings.darkMode);
    }

    updateColorScheme() {
        document.body.className = document.body.className.replace(/color-scheme-\w+/, '');
        document.body.classList.add(`color-scheme-${this.settings.colorScheme}`);
    }

    updateLanguage() {
        // Implement language change logic
        document.documentElement.lang = this.settings.language;
        // Update UI text based on selected language
    }

    async requestNotificationPermission() {
        if (this.settings.notifications && Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                this.settings.notifications = false;
                this.saveSettings();
                const notifications = document.getElementById('notifications');
                if (notifications) {
                    notifications.checked = false;
                }
            }
        }
    }

    toggleAutoClick() {
        if (this.settings.autoClick) {
            this.startAutoClick();
        } else {
            this.stopAutoClick();
        }
    }

    startAutoClick() {
        this.autoClickInterval = setInterval(() => {
            if (mowgliApp.energy > 0) {
                mowgliApp.updateCoins(1);
                mowgliApp.energy--;
                localStorage.setItem('energy', mowgliApp.energy);
            }
        }, 1000);
    }

    stopAutoClick() {
        if (this.autoClickInterval) {
            clearInterval(this.autoClickInterval);
        }
    }

    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to default?')) {
            this.settings = {
                soundEffects: true,
                volume: 50,
                notifications: true,
                language: 'en',
                darkMode: true,
                colorScheme: 'default',
                autoClick: false,
                vibration: true
            };
            this.saveSettings();
            location.reload();
        }
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
}); 