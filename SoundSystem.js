export class SoundSystem {
    constructor() {
        this.sounds = new Map();
        this.enabled = true;
        this.volume = 0.5;
        this.loadSounds();
    }

    async loadSounds() {
        const soundFiles = {
            click: 'assets/sounds/click.mp3',
            levelUp: 'assets/sounds/level-up.mp3',
            reward: 'assets/sounds/reward.mp3',
            error: 'assets/sounds/error.mp3',
            achievement: 'assets/sounds/achievement.mp3'
        };

        for (const [name, path] of Object.entries(soundFiles)) {
            try {
                const audio = new Audio(path);
                audio.volume = this.volume;
                this.sounds.set(name, audio);
            } catch (error) {
                console.error(`Failed to load sound: ${name}`, error);
            }
        }
    }

    play(soundName) {
        if (!this.enabled) return;

        const sound = this.sounds.get(soundName);
        if (sound) {
            // Clone the audio to allow multiple plays
            const clone = sound.cloneNode();
            clone.volume = this.volume;
            clone.play().catch(error => {
                console.error(`Failed to play sound: ${soundName}`, error);
            });
        }
    }

    setVolume(level) {
        this.volume = Math.max(0, Math.min(1, level));
        for (const sound of this.sounds.values()) {
            sound.volume = this.volume;
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
} 