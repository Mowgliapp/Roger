const { Telegraf } = require('telegraf');
const firebaseConfig = require('./firebase.config');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, get, update } = require('firebase/database');

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

// Initialize bot with your token
const bot = new Telegraf('7514616361:AAHhAqE3oreyw4krAU35at38b68ZvIOMlDU');

// Handle start command with referral
bot.command('start', async (ctx) => {
    const startParam = ctx.message.text.split(' ')[1]; // Get referral username
    const user = ctx.from;

    try {
        // Initialize user if they don't exist
        const userRef = ref(db, `users/${user.username}`);
        const userSnapshot = await get(userRef);

        if (!userSnapshot.exists()) {
            // New user
            await set(userRef, {
                username: user.username,
                coins: 0,
                lastUpdated: Date.now(),
                referrer: startParam || null
            });

            // If user was referred, handle referral
            if (startParam) {
                const referrerRef = ref(db, `referrals/${startParam}/${user.username}`);
                await set(referrerRef, {
                    username: user.username,
                    joinedAt: Date.now(),
                    rewarded: true
                });

                // Add coins to referrer
                const referrerUserRef = ref(db, `users/${startParam}`);
                const referrerSnapshot = await get(referrerUserRef);
                if (referrerSnapshot.exists()) {
                    const currentCoins = referrerSnapshot.val().coins || 0;
                    await update(referrerUserRef, {
                        coins: currentCoins + 1000,
                        lastUpdated: Date.now()
                    });
                }

                ctx.reply(`Welcome! You were referred by @${startParam}. They received 1000 coins!`);
            } else {
                ctx.reply('Welcome to Mowgli Bot! Share your referral link to earn coins!');
            }
        } else {
            ctx.reply('Welcome back to Mowgli Bot!');
        }
    } catch (error) {
        console.error('Error in start command:', error);
        ctx.reply('Sorry, there was an error processing your request.Please set your UserName in telegram');
    }
});

// Handle errors
bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}:`, err);
});

// Start bot
bot.launch().then(() => {
    console.log('Bot is running!');
}).catch(err => {
    console.error('Error starting bot:', err);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

