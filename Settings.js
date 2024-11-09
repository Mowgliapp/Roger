export class SettingsSystem {
    constructor(gameEngine) {
        this.game = gameEngine;
        this.settings = {
            sound: {
                enabled: true,
                volume: 0.5,
                effects: true,
                music: true
            },
            notifications: {
                enabled: true,
                achievements: true,
                dailyReminder: true,
                energyFull: true
            },
            gameplay: {
                autoCollect: false,
                powerSaveMode: false,
                reducedAnimations: false,
                clickFeedback: true
            },
            theme: {
                darkMode: true,
                particleEffects: true,
                colorScheme: 'default'
            }
        };
        this.initialize();
    }

    async initialize() {
        await this.loadSettings();
        this.applySettings();
    }

    async loadSettings() {
        try {
            // Load from localStorage first
            const savedSettings = localStorage.getItem('mowgli_settings');
            if (savedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            }

            // Then load from Firebase (takes precedence)
            const settingsRef = ref(this.game.db, `users/${this.game.user.username}/settings`);
            const snapshot = await get(settingsRef);
            const firebaseSettings = snapshot.val();
            
            if (firebaseSettings) {
                this.settings = { ...this.settings, ...firebaseSettings };
                this.saveToLocal(); // Sync local storage
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    async saveSettings() {
        try {
            // Save to localStorage
            this.saveToLocal();

            // Save to Firebase
            const settingsRef = ref(this.game.db, `users/${this.game.user.username}/settings`);
            await set(settingsRef, this.settings);

            // Apply changes
            this.applySettings();
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    saveToLocal() {
        localStorage.setItem('mowgli_settings', JSON.stringify(this.settings));
    }

    applySettings() {
        // Apply sound settings
        this.game.sound.enabled = this.settings.sound.enabled;
        this.game.sound.setVolume(this.settings.sound.volume);

        // Apply theme
        document.body.classList.toggle('dark-mode', this.settings.theme.darkMode);
        document.body.classList.toggle('reduced-motion', this.settings.gameplay.reducedAnimations);

        // Apply gameplay settings
        if (this.settings.gameplay.powerSaveMode) {
            this.enablePowerSaveMode();
        }

        // Emit settings changed event
        this.game.events.emit('settingsChanged', this.settings);
    }

    updateSetting(category, setting, value) {
        if (this.settings[category] && this.settings[category].hasOwnProperty(setting)) {
            this.settings[category][setting] = value;
            this.saveSettings();
            return true;
        }
        return false;
    }

    getSetting(category, setting) {
        return this.settings[category]?.[setting];
    }

    enablePowerSaveMode() {
        this.settings.gameplay.reducedAnimations = true;
        this.settings.theme.particleEffects = false;
        this.applySettings();
    }

    resetSettings() {
        localStorage.removeItem('mowgli_settings');
        this.settings = {
            sound: {
                enabled: true,
                volume: 0.5,
                effects: true,
                music: true
            },
            notifications: {
                enabled: true,
                achievements: true,
                dailyReminder: true,
                energyFull: true
            },
            gameplay: {
                autoCollect: false,
                powerSaveMode: false,
                reducedAnimations: false,
                clickFeedback: true
            },
            theme: {
                darkMode: true,
                particleEffects: true,
                colorScheme: 'default'
            }
        };
        return this.saveSettings();
    }
} 