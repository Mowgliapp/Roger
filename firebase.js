import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js';
import { getDatabase, ref, set, get, update, onValue } from 'https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyDhXhdgccrG0fBfA4E7UEeRhjr4rxIq_oY",
    authDomain: "mowgli-refferal-data.firebaseapp.com",
    databaseURL: "https://mowgli-refferal-data-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "mowgli-refferal-data",
    storageBucket: "mowgli-refferal-data.appspot.com",
    messagingSenderId: "499110209498",
    appId: "1:499110209498:web:9ba00de1466e07882e3",
    measurementId: "G-L0RYHEJYXX"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Separate function for updating coins only
export async function updateCoins(username, newAmount) {
    if (!username) return null;
    
    try {
        const coinsRef = ref(db, `users/${username}/coins`);
        await set(coinsRef, newAmount);
        return true;
    } catch (error) {
        console.error('Error updating coins:', error);
        return false;
    }
}

// Handle withdrawal and transaction creation
export async function handleWithdrawal(username, withdrawAmount) {
    if (!username) throw new Error('Username required');

    const userRef = ref(db, `users/${username}`);
    const transactionsRef = ref(db, `transactions/${username}`);

    try {
        // Get current user data
        const snapshot = await get(userRef);
        if (!snapshot.exists()) throw new Error('User not found');

        const userData = snapshot.val();
        const currentCoins = userData.coins || 0;

        if (currentCoins < withdrawAmount) {
            throw new Error('Insufficient coins');
        }

        const newBalance = currentCoins - withdrawAmount;
        const timestamp = Date.now();

        // Create new transaction
        const transaction = {
            type: 'Withdrawal',
            amount: withdrawAmount,
            status: 'pending',
            timestamp: timestamp
        };

        // Update both locations atomically
        const updates = {};
        updates[`users/${username}/coins`] = newBalance;
        updates[`transactions/${username}/${timestamp}`] = transaction;

        await update(ref(db), updates);

        return {
            success: true,
            newBalance: newBalance
        };
    } catch (error) {
        console.error('Withdrawal error:', error);
        throw error;
    }
}

// Get transactions
export async function getTransactions(username) {
    if (!username) return [];
    
    try {
        const transactionsRef = ref(db, `transactions/${username}`);
        const snapshot = await get(transactionsRef);
        
        if (!snapshot.exists()) return [];
        
        return Object.values(snapshot.val())
            .sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
        console.error('Error getting transactions:', error);
        return [];
    }
}

// Listen for transaction changes
export function onTransactionsChange(username, callback) {
    if (!username) return () => {};
    
    const transactionsRef = ref(db, `transactions/${username}`);
    return onValue(transactionsRef, (snapshot) => {
        const transactions = snapshot.exists() 
            ? Object.values(snapshot.val()).sort((a, b) => b.timestamp - a.timestamp)
            : [];
        callback(transactions);
    });
}

// Get user data
export async function getUserData(username) {
    if (!username) return null;
    
    try {
        const userRef = ref(db, `users/${username}`);
        const snapshot = await get(userRef);
        return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
}

// Listen for user data changes
export function onUserDataChange(username, callback) {
    if (!username) return () => {};
    
    const userRef = ref(db, `users/${username}`);
    return onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val());
        }
    });
}

export { db, ref, set, get, update, onValue }; 