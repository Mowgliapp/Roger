export class StateManager {
    constructor() {
        this.states = {
            LOADING: 'loading',
            READY: 'ready',
            ERROR: 'error',
            OFFLINE: 'offline'
        };
        
        this.currentState = this.states.LOADING;
        this.listeners = new Set();
        
        // Monitor connection status
        this.setupConnectionMonitoring();
    }

    setState(newState, data = null) {
        this.currentState = newState;
        this.notifyListeners(data);
    }

    addListener(callback) {
        this.listeners.add(callback);
    }

    removeListener(callback) {
        this.listeners.delete(callback);
    }

    notifyListeners(data) {
        this.listeners.forEach(callback => callback(this.currentState, data));
    }

    setupConnectionMonitoring() {
        window.addEventListener('online', () => {
            this.setState(this.states.READY);
        });

        window.addEventListener('offline', () => {
            this.setState(this.states.OFFLINE);
        });
    }
} 