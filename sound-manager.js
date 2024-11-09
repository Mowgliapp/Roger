class SoundManager {
    constructor() {
        this.sounds = {
            click: new Audio('assets/sounds/click.mp3'),
            coin: new Audio('assets/sounds/coin.mp3'),
            achievement: new Audio('assets/sounds/achievement.mp3'),
            levelUp: new Audio('assets/sounds/level-up.mp3'),
            error: new Audio('assets/sounds/error.mp3')
        };
        
        this.initialize();
    }

    initialize() {
        // Preload all sounds
        Object.values(this.sounds).forEach(sound => {
            sound.load();
        });
    }

    play(soundName) {
        const settings = JSON.parse(localStorage.getItem('userSettings')) || {};
        
        if (settings.soundEffects && this.sounds[soundName]) {
            const sound = this.sounds[soundName];
            sound.volume = settings.volume / 100 || 0.5;
            sound.currentTime = 0;
            sound.play().catch(error => console.log('Sound play failed:', error));
        }
    }

    stopAll() {
        Object.values(this.sounds).forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });
    }
}

// Create global sound manager instance
window.soundManager = new SoundManager();
export { soundManager }; 