import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js";
import { getDatabase, ref, onValue, get, set, update } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js";

let lastAdTime = 0;
const adCooldown = 300000; // 5 minutes

document.addEventListener('DOMContentLoaded', () => {
    let totalClaimableCoins = parseInt(localStorage.getItem('claimableCoins') || '0');
    const claimAllButton = document.querySelector('.claim-all-button');
    
    function updateClaimAllButton() {
        const rewardAmount = claimAllButton.querySelector('.reward-amount');
        rewardAmount.textContent = `+${totalClaimableCoins}`;
        
        if (totalClaimableCoins > 0) {
            claimAllButton.classList.add('has-rewards');
            localStorage.setItem('claimableCoins', totalClaimableCoins);
        } else {
            claimAllButton.classList.remove('has-rewards');
            localStorage.removeItem('claimableCoins');
        }
    }

    const taskConfigs = {
        daily: [
            { 
                id: 'daily_login',
                title: 'Daily Login', 
                description: 'Login daily to earn rewards', 
                reward: 100, 
                icon: 'fa-calendar-check',
                link: '#',
                linkIcon: 'fa-arrow-right',
                linkText: 'Check In'
            },
     
            { 
                id: 'claim_daily',
                title: 'Claim Rewards', 
                description: 'Coming Soon', 
                reward: 250, 
                icon: 'fa-gift',
                isLocked: true,
                lockIcon: 'fa-lock',
                lockText: 'Coming Soon'
            },
            {
                id: 'watch_earn',
                title: 'Watch & Earn',
                description: 'Watch content to earn coins',
                reward: 1000,
                icon: 'fa-play-circle',
                isVideo: true,
                cooldown: 300000 // 5 minutes cooldown
            },
            {
                id: 'premium_rewards',
                title: 'Premium Rewards',
                description: 'Get 2x rewards with VIP status',
                reward: '2x All Rewards',
                icon: 'fa-crown',
                isPremium: true,
                premiumPrice: '100 USDT'
            }
        ],
        social: [
            {
                id: 'telegram_join',
                title: 'Join Telegram',
                description: 'Join our Telegram channel',
                reward: 200,
                icon: 'fa-telegram',
                link: 'https://t.me/mowgliorg',
                linkIcon: 'fa-telegram',
                linkText: 'Join Channel',
                platform: 'telegram'
            },
            {
                id: 'discord_join',
                title: 'Join Discord',
                description: 'Join our Discord server',
                reward: 200,
                icon: 'fa-discord',
                link: 'https://discord.gg/RFsXuwfQ',
                linkIcon: 'fa-discord',
                linkText: 'Join Server',
                platform: 'discord'
            },
            {
                id: 'twitter_follow',
                title: 'Follow Twitter',
                description: 'Follow us on Twitter',
                reward: 300,
                icon: 'fa-twitter',
                link: 'https://x.com/AppMowgli99107?s=35',
                linkIcon: 'fa-twitter',
                linkText: 'Follow Us',
                platform: 'twitter'
            },
            {
                id: 'facebook_follow',
                title: 'Follow Facebook',
                description: 'Follow our Facebook page',
                reward: 250,
                icon: 'fa-facebook',
                link: 'https://facebook.com/share/dR4G6vhLnfBc36nt/?mibextid=qi2Omg',
                linkIcon: 'fa-facebook',
                linkText: 'Follow Page',
                platform: 'facebook'
            },
            {
                id: 'tiktok_follow',
                title: 'Follow TikTok',
                description: 'Follow us on TikTok',
                reward: 300,
                icon: 'fa-tiktok',
                link: 'https://tiktok.com/@mowgli8619?_t=8qvNBPyR9nX&_r=1',
                linkIcon: 'fa-tiktok',
                linkText: 'Follow Us',
                platform: 'tiktok'
            },
            {
                id: 'youtube_sub',
                title: 'Subscribe YouTube',
                description: 'Subscribe to our channel',
                reward: 250,
                icon: 'fa-youtube',
                link: 'https://www.youtube.com/@MowgliofficiaI',
                linkIcon: 'fa-youtube',
                linkText: 'Subscribe',
                platform: 'youtube'
            }
        ],
        achievement: [
            {
                id: 'social_butterfly',
                title: 'Social Butterfly',
                description: 'Join our community',
                reward: 400,
                icon: 'fa-users',
                link: 'https://t.me/mowgliorg',
                linkIcon: 'fa-users',
                linkText: 'Join Community'
            },
            {
                id: 'first_steps',
                title: 'First Steps',
                description: 'Coming Soon',
                reward: 500,
                icon: 'fa-shoe-prints',
                isLocked: true,
                lockIcon: 'fa-lock',
                lockText: 'Coming Soon'
            },
            {
                id: 'power_player',
                title: 'Power Player',
                description: 'Coming Soon',
                reward: 1000,
                icon: 'fa-crown',
                isLocked: true,
                lockIcon: 'fa-lock',
                lockText: 'Coming Soon'
            },
            {
                id: 'master_collector',
                title: 'Master Collector',
                description: 'Coming Soon',
                reward: 2000,
                icon: 'fa-trophy',
                isLocked: true,
                lockIcon: 'fa-lock',
                lockText: 'Coming Soon'
            }
        ]
    };

    function getTaskProgress(taskId) {
        switch(taskId) {
            case 'daily_login':
                return { current: 1, required: 1 }; // Always completed

            case 'daily_clicks':
                const clicks = parseInt(localStorage.getItem('dailyClicks') || '0');
                return { current: clicks, required: 5 };

            case 'use_energy':
                const energyUsed = parseInt(localStorage.getItem('energyUsed') || '0');
                return { current: energyUsed, required: 50 };

            case 'telegram_join':
                // Check if user is from Telegram
                return { 
                    current: Telegram.WebApp.initDataUnsafe.user ? 1 : 0, 
                    required: 1 
                };

            case 'master_collector':
                const coins = parseInt(localStorage.getItem('coins') || '0');
                return { current: coins, required: 1000 };

            // Add more task progress checks as needed
            default:
                return { current: 0, required: 1 };
        }
    }

    function isTaskCompletable(taskId) {
        if (taskId === 'daily_login') {
            const lastCheckIn = localStorage.getItem('lastCheckIn');
            const today = new Date().toDateString();
            return !lastCheckIn || lastCheckIn !== today;
        }
        const completedTasks = JSON.parse(localStorage.getItem('completedTasks') || '[]');
        return completedTasks.includes(taskId);
    }

    function createTaskElement(task, type) {
        if (task.isVideo) {
            return `
                <div class="slide-task-item" data-task-id="${task.id}">
                    <div class="task-info">
                        <div class="task-title">
                            <i class="fas ${task.icon}"></i>
                            ${task.title}
                        </div>
                        <div class="task-description">${task.description}</div>
                    </div>
                    <div class="task-reward">
                        <span class="reward-amount">+${task.reward}</span>
                        <img src="assets/images/coin.gif" width="20" height="20" alt="coins">
                    </div>
                    <button class="task-claim-button watch-video-btn" onclick="handleAdgramAd()">
                        <i class="fas fa-play-circle"></i>
                        <span>Watch Now</span>
                    </button>
                </div>
            `;
        }
        
        if (task.isLocked) {
            return `
                <div class="slide-task-item locked" data-task-id="${task.id}">
                    <div class="task-info">
                        <div class="task-title">
                            <i class="fas ${task.icon}"></i>
                            ${task.title}
                        </div>
                        <div class="task-description">
                            <i class="fas ${task.lockIcon}"></i>
                            ${task.description}
                        </div>
                    </div>
                    <div class="task-reward locked">
                        <span class="reward-amount">+${task.reward}</span>
                        <img src="assets/images/coin.gif" width="20" height="20" alt="coins">
                    </div>
                    <button class="task-claim-button locked" disabled>
                        <i class="fas fa-lock"></i>
                        <span>Coming Soon</span>
                    </button>
                </div>
            `;
        }
        const claimedTasks = JSON.parse(localStorage.getItem('claimedTasks') || '[]');
        const completedTasks = JSON.parse(localStorage.getItem('completedTasks') || '[]');
        const isClaimed = claimedTasks.includes(task.id);
        const isCompleted = completedTasks.includes(task.id);
        
        let buttonHtml;
        if (isClaimed) {
            buttonHtml = `
                <button class="task-claim-button completed" data-task-id="${task.id}" disabled>
                    <i class="fas fa-check"></i>
                    <span>Claimed</span>
                </button>
            `;
        } else if (isCompleted) {
            buttonHtml = `
                <button class="task-claim-button ready" data-task-id="${task.id}">
                    <i class="fas fa-gift"></i>
                    <span>Claim</span>
                </button>
            `;
        } else {
            buttonHtml = `
                <button class="task-claim-button incomplete" data-task-id="${task.id}" disabled>
                    <i class="fas fa-lock"></i>
                    <span>Complete Task</span>
                </button>
            `;
        }

        return `
            <div class="slide-task-item" data-task-id="${task.id}">
                <div class="task-info">
                    <div class="task-title">
                        <i class="fab ${task.icon}"></i>
                        ${task.title}
                    </div>
                    <div class="task-description">${task.description}</div>
                </div>
                <div class="task-reward">
                    <span class="reward-amount">+${task.reward}</span>
                    <img src="assets/images/coin.gif" width="20" height="20" alt="coins">
                </div>
                ${task.link ? `
                    <a href="${task.link}" class="task-link-button ${task.platform || ''}" data-task-id="${task.id}">
                        <i class="fab ${task.linkIcon}"></i>
                        ${task.linkText}
                    </a>
                ` : ''}
                ${buttonHtml}
            </div>
        `;
    }

    function initializeTasks() {
        const buttons = document.querySelectorAll('.task-button');
        
        buttons.forEach(button => {
            const type = button.dataset.taskType;
            const tasks = taskConfigs[type];
            
          
            const slideContent = document.createElement('div');
            slideContent.className = 'slide-down-content';
            slideContent.innerHTML = tasks.map(task => createTaskElement(task, type)).join('');
            
           
            button.parentNode.insertBefore(slideContent, button.nextSibling);
            
            
            button.addEventListener('click', () => {
                toggleSlideContent(slideContent, button);
            });
        });

       
        document.querySelectorAll('.task-claim-button').forEach(button => {
            button.addEventListener('click', handleClaimClick);
        });

        // Check for claimed tasks
        const claimedTasks = JSON.parse(localStorage.getItem('claimedTasks') || '[]');
        
        // Update UI for claimed tasks
        document.querySelectorAll('.task-claim-button').forEach(button => {
            const taskId = button.dataset.taskId;
            if (claimedTasks.includes(taskId)) {
                button.classList.add('completed');
                button.disabled = true;
                button.innerHTML = `
                    <i class="fas fa-check"></i>
                    <span>Claimed</span>
                `;
            }
        });

        // Add click handlers for task links
        document.querySelectorAll('.task-link-button').forEach(link => {
            link.addEventListener('click', handleTaskLinkClick);
        });
    }

    function handleClaimClick(e) {
        const button = e.currentTarget;
        const taskId = button.dataset.taskId;
        
        if (!isTaskCompletable(taskId)) {
            const message = document.createElement('div');
            message.className = 'task-message error';
            message.textContent = 'Complete the task requirements first!';
            document.body.appendChild(message);
            setTimeout(() => message.remove(), 2000);
            return;
        }

        const claimedTasks = JSON.parse(localStorage.getItem('claimedTasks') || '[]');
        if (claimedTasks.includes(taskId)) {
            return;
        }

        const taskItem = button.closest('.slide-task-item');
        const rewardText = taskItem.querySelector('.reward-amount').textContent;
        const rewardAmount = parseInt(rewardText.replace('+', ''));
        
        button.classList.add('claiming');
        
        // Create flying coin animation
        const coinElement = document.createElement('div');
        coinElement.className = 'flying-coin';
        coinElement.innerHTML = '<img src="assets/images/coin.gif" width="20" height="20" alt="coins">';
        taskItem.appendChild(coinElement);

        const buttonRect = button.getBoundingClientRect();
        const claimAllRect = claimAllButton.getBoundingClientRect();
        
        coinElement.style.cssText = `
            left: ${buttonRect.left}px;
            top: ${buttonRect.top}px;
        `;
        
        setTimeout(() => {
            coinElement.style.cssText = `
                left: ${claimAllRect.left}px;
                top: ${claimAllRect.top}px;
                transform: scale(0);
            `;
            
            totalClaimableCoins += rewardAmount;
            updateClaimAllButton();
            
            setTimeout(() => coinElement.remove(), 500);
        }, 50);

        setTimeout(() => {
            button.classList.remove('claiming');
            button.classList.add('completed');
            button.disabled = true;
            button.innerHTML = `
                <i class="fas fa-check"></i>
                <span>Claimed</span>
            `;
            
            claimedTasks.push(taskId);
            localStorage.setItem('claimedTasks', JSON.stringify(claimedTasks));

            // Show success message
            const message = document.createElement('div');
            message.className = 'task-message success';
            message.textContent = `+${rewardAmount} coins claimed!`;
            document.body.appendChild(message);
            setTimeout(() => message.remove(), 2000);
        }, 1000);
    }

    // Add this function to handle link clicks and unlock claim buttons
    function handleTaskLinkClick(e) {
        const link = e.currentTarget;
        const taskId = link.dataset.taskId;
        
        // Handle daily login specially
        if (taskId === 'daily_login') {
            e.preventDefault();
            createDailyCheckInPopup();
            return;
        }
        
        const taskItem = link.closest('.slide-task-item');
        const claimButton = taskItem.querySelector('.task-claim-button');
        
        // Store completed task
        const completedTasks = JSON.parse(localStorage.getItem('completedTasks') || '[]');
        if (!completedTasks.includes(taskId)) {
            completedTasks.push(taskId);
            localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
            
            // Update button state
            claimButton.classList.remove('incomplete');
            claimButton.classList.add('ready');
            claimButton.disabled = false;
            claimButton.innerHTML = `
                <i class="fas fa-gift"></i>
                <span>Claim</span>
            `;

            // Show completion message
            const message = document.createElement('div');
            message.className = 'task-message success';
            message.textContent = 'Task completed! Claim your reward!';
            document.body.appendChild(message);
            setTimeout(() => message.remove(), 2000);
        }
    }

    // Initialize Firebase
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
    const user = Telegram.WebApp.initDataUnsafe.user;

    // Modified syncPoints function to work with Firebase
    async function syncPoints() {
        const taskPoints = document.getElementById('task-points');
        if (user?.username) {
            try {
                const snapshot = await get(ref(db, 'users/' + user.username));
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    const coins = userData.coins?.coins || userData.coins || 0;
                    taskPoints.textContent = coins;
                    localStorage.setItem('coins', coins);
                }
            } catch (error) {
                console.error('Error fetching points:', error);
                const localCoins = localStorage.getItem('coins') || '0';
                taskPoints.textContent = localCoins;
            }
        } else {
            const localCoins = localStorage.getItem('coins') || '0';
            taskPoints.textContent = localCoins;
        }
    }

    // Set up real-time listener for Firebase updates
    if (user?.username) {
        const userRef = ref(db, 'users/' + user.username);
        onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                syncPoints();
            }
        });
    }

    // Modified claimAllButton click handler to update Firebase
    claimAllButton.addEventListener('click', async () => {
        if (totalClaimableCoins > 0) {
            claimAllButton.classList.add('claiming');
            
            try {
                const currentBalance = parseInt(localStorage.getItem('coins') || '0');
                const newBalance = currentBalance + totalClaimableCoins;
                
                // Update Firebase if user is logged in
                if (user?.username) {
                    await set(ref(db, 'users/' + user.username), {
                        coins: newBalance,
                        lastUpdated: Date.now()
                    });
                }
                
                localStorage.setItem('coins', newBalance);
                
                if (window.walletManager) {
                    window.walletManager.updateBalanceDisplay(newBalance);
                }

                syncPoints();
                
                setTimeout(() => {
                    totalClaimableCoins = 0;
                    updateClaimAllButton();
                    claimAllButton.classList.remove('claiming');
                    
                    const message = document.createElement('div');
                    message.className = 'reward-claimed-message';
                    message.textContent = 'Rewards Claimed!';
                    document.body.appendChild(message);
                    
                    setTimeout(() => message.remove(), 2000);
                }, 1000);
            } catch (error) {
                console.error('Failed to claim rewards:', error);
                claimAllButton.classList.remove('claiming');
                
                const message = document.createElement('div');
                message.className = 'reward-claimed-message error';
                message.textContent = 'Failed to claim rewards. Please try again.';
                document.body.appendChild(message);
                setTimeout(() => message.remove(), 2000);
            }
        }
    });

    // Initialize points on page load
    syncPoints();

    window.addEventListener('storage', (e) => {
        if (e.key === 'coins') {
            syncPoints();
        }
    });

    function toggleSlideContent(element, button) {
        const isOpen = element.classList.contains('active');
        
      
        document.querySelectorAll('.slide-down-content.active').forEach(content => {
            if (content !== element) {
                content.classList.remove('active');
                content.style.maxHeight = '0';
                const otherButton = content.previousElementSibling;
                if (otherButton) otherButton.classList.remove('active');
            }
        });

        
        element.classList.toggle('active');
        button.classList.toggle('active');
        
        if (!isOpen) {
            element.style.maxHeight = `${element.scrollHeight}px`;
        } else {
            element.style.maxHeight = '0';
        }
    }

    // Add this function to check and update task status
    function checkAndUpdateTaskStatus() {
        const taskButtons = document.querySelectorAll('.task-claim-button');
        const claimedTasks = JSON.parse(localStorage.getItem('claimedTasks') || '[]');

        taskButtons.forEach(button => {
            const taskId = button.dataset.taskId;
            if (!claimedTasks.includes(taskId)) {
                const isComplete = isTaskCompletable(taskId);
                if (isComplete && button.classList.contains('incomplete')) {
                    // Task is now complete - update button
                    button.classList.remove('incomplete');
                    button.classList.add('ready');
                    button.disabled = false;
                    button.innerHTML = `
                        <i class="fas fa-gift"></i>
                        <span>Claim</span>
                    `;

                    // Show completion notification
                    const message = document.createElement('div');
                    message.className = 'task-message success';
                    message.textContent = 'Task completed! Claim your reward!';
                    document.body.appendChild(message);
                    setTimeout(() => message.remove(), 2000);
                }
            }
        });
    }

    // Add event listeners for different task types
    document.addEventListener('DOMContentLoaded', () => {
        // ... existing code ...

        // Listen for clicks (for click-based tasks)
        document.addEventListener('click', () => {
            const clicks = parseInt(localStorage.getItem('dailyClicks') || '0') + 1;
            localStorage.setItem('dailyClicks', clicks);
            checkAndUpdateTaskStatus();
        });

        // Listen for energy usage
        const energyObserver = new MutationObserver(() => {
            const energyElement = document.getElementById('energy');
            if (energyElement) {
                const currentEnergy = parseInt(energyElement.textContent);
                const previousEnergy = parseInt(localStorage.getItem('previousEnergy') || '100');
                const energyUsed = parseInt(localStorage.getItem('energyUsed') || '0');
                
                if (currentEnergy < previousEnergy) {
                    const newEnergyUsed = energyUsed + (previousEnergy - currentEnergy);
                    localStorage.setItem('energyUsed', newEnergyUsed);
                    localStorage.setItem('previousEnergy', currentEnergy);
                    checkAndUpdateTaskStatus();
                }
            }
        });

        // Observe energy changes
        const energyElement = document.getElementById('energy');
        if (energyElement) {
            energyObserver.observe(energyElement, { childList: true, characterData: true, subtree: true });
        }

        // Check coin balance changes
        const coinObserver = new MutationObserver(() => {
            checkAndUpdateTaskStatus();
        });

        const coinElement = document.getElementById('task-points');
        if (coinElement) {
            coinObserver.observe(coinElement, { childList: true, characterData: true, subtree: true });
        }

        // Check social tasks completion
        function checkSocialTask(taskId, platform) {
            // You can implement platform-specific checks here
            // For example, checking if user visited the link
            const visited = localStorage.getItem(`visited_${platform}`);
            if (visited) {
                checkAndUpdateTaskStatus();
            }
        }

        // Add click handlers for social links
        document.querySelectorAll('.task-link-button').forEach(link => {
            const taskItem = link.closest('.slide-task-item');
            const taskId = taskItem.dataset.taskId;
            
            link.addEventListener('click', () => {
                const platform = taskId.split('_')[0]; // e.g., 'telegram' from 'telegram_join'
                localStorage.setItem(`visited_${platform}`, 'true');
                checkAndUpdateTaskStatus();
            });
        });

        // Initial check
        checkAndUpdateTaskStatus();

        // Periodic check (every minute)
        setInterval(checkAndUpdateTaskStatus, 60000);
    });

    // Add this function after taskConfigs
    function createDailyCheckInPopup() {
        const today = new Date().toDateString();
        
        const popup = document.createElement('div');
        popup.className = 'daily-checkin-popup';
        
        popup.innerHTML = `
            <div class="daily-checkin-content">
                <div class="daily-checkin-title">
                    <i class="fas fa-calendar-check"></i>
                    Daily Check-in
                </div>
                <div class="daily-checkin-reward">
                    <div>Today's Reward</div>
                    <div class="daily-checkin-amount">+100 coins</div>
                    <div class="daily-checkin-streak">
                        <i class="fas fa-fire"></i> 
                        Current Streak: ${currentStreak} days
                    </div>
                </div>
                <button class="daily-checkin-button">
                    <i class="fas fa-gift"></i>
                    Claim Reward
                </button>
                <button class="daily-checkin-close">Close</button>
            </div>
        `;

        document.body.appendChild(popup);
        
        // Add event listeners
        const claimButton = popup.querySelector('.daily-checkin-button');
        const closeButton = popup.querySelector('.daily-checkin-close');
        
        claimButton.addEventListener('click', async () => {
            try {
                const username = Telegram.WebApp.initDataUnsafe.user?.username;
                if (!username) return;

                // Update streak and last check-in
                if (lastCheckIn !== today) {
                    currentStreak++;
                    localStorage.setItem('checkInStreak', currentStreak);
                    localStorage.setItem('lastCheckIn', today);
                    
                    // Give reward
                    const userRef = ref(db, `users/${username}`);
                    const snapshot = await get(userRef);
                    const currentCoins = snapshot.val()?.coins || 0;
                    const reward = 100;
                    
                    await update(userRef, {
                        coins: currentCoins + reward,
                        lastCheckIn: today,
                        checkInStreak: currentStreak
                    });

                    showNotification(`Claimed ${reward} coins! Streak: ${currentStreak} days`);
                    syncPoints(); // Update displayed points
                }
            } catch (error) {
                console.error('Error claiming daily reward:', error);
                showNotification('Failed to claim reward', 'error');
            }
            popup.remove();
        });
        
        closeButton.addEventListener('click', () => popup.remove());
        
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                popup.remove();
            }
        });
    }

    initializeTasks();

    // Call this on page load to set initial state
    updateClaimAllButton();

    // Add near the top of your DOMContentLoaded event
    let lastAdTime = 0;
    const adCooldown = 300000; // 5 minutes

    // Update the showTelegramAd function
    window.showTelegramAd = async function() {
        const now = Date.now();
        if (now - lastAdTime < adCooldown) {
            const remainingTime = Math.ceil((adCooldown - (now - lastAdTime)) / 1000);
            Telegram.WebApp.showPopup({
                title: 'Please Wait',
                message: `You can watch another ad in ${remainingTime} seconds`,
                buttons: [{type: "ok"}]
            });
            return;
        }

        try {
            // Initialize SAD (Simple Ad)
            window.sad.init({
                onAdLoaded: () => {
                    console.log('Ad loaded successfully');
                },
                onAdCompleted: () => {
                    lastAdTime = Date.now();
                    giveAdReward();
                },
                onAdError: (error) => {
                    console.error('Ad error:', error);
                    Telegram.WebApp.showPopup({
                        title: 'Error',
                        message: 'Failed to load ad. Please try again later.',
                        buttons: [{type: "ok"}]
                    });
                }
            });

            // Show the ad
            window.sad.showAd();

        } catch (error) {
            console.error('Error showing ad:', error);
            Telegram.WebApp.showPopup({
                title: 'Error',
                message: 'Ad service is currently unavailable. Please try again later.',
                buttons: [{type: "ok"}]
            });
        }
    };

    async function giveAdReward() {
        const rewardAmount = 1000;
        const username = Telegram.WebApp.initDataUnsafe.user?.username;
        
        if (!username) return;

        try {
            const userRef = ref(db, `users/${username}`);
            const snapshot = await get(userRef);
            const currentCoins = snapshot.val()?.coins || 0;

            await update(userRef, {
                coins: currentCoins + rewardAmount,
                lastUpdated: Date.now()
            });

            Telegram.WebApp.showPopup({
                title: 'Reward Received!',
                message: `You earned ${rewardAmount} coins!`
            });

            // Update displayed coins
            syncPoints();
        } catch (error) {
            console.error('Error giving reward:', error);
        }
    }

    // Add these constants at the top
    const VIP_PLANS = {
        vip_1month: {
            duration: '1 Month',
            price: '10 USDT',
            priceInUSDT: 10,
            durationInDays: 30,
            benefits: ['2x All Rewards', 'Reduced Cooldowns', 'Exclusive Tasks']
        },
        vip_3months: {
            duration: '3 Months',
            price: '25 USDT',
            priceInUSDT: 25,
            durationInDays: 90,
            benefits: ['2x All Rewards', 'Reduced Cooldowns', 'Exclusive Tasks', '10% Bonus']
        },
        vip_12months: {
            duration: '12 Months',
            price: '80 USDT',
            priceInUSDT: 80,
            durationInDays: 365,
            benefits: ['2x All Rewards', 'Reduced Cooldowns', 'Exclusive Tasks', '25% Bonus']
        }
    };

    // Update the showVIPOptions function
    window.showVIPOptions = function() {
        const popup = document.createElement('div');
        popup.className = 'vip-popup';
        popup.innerHTML = `
            <div class="vip-popup-content">
                <h3><i class="fas fa-crown"></i> VIP Membership</h3>
                <div class="vip-plans">
                    ${Object.entries(VIP_PLANS).map(([planId, plan]) => `
                        <div class="vip-plan">
                            <h4>${plan.duration}</h4>
                            <div class="vip-price">${plan.price}</div>
                            <ul class="vip-benefits-list">
                                ${plan.benefits.map(benefit => `
                                    <li><i class="fas fa-check"></i> ${benefit}</li>
                                `).join('')}
                            </ul>
                            <button class="vip-buy-button" onclick="processVIPPurchase('${planId}')">
                                Upgrade Now
                            </button>
                        </div>
                    `).join('')}
                </div>
                <button class="close-popup">Close</button>
            </div>
        `;

        document.body.appendChild(popup);

        const closeButton = popup.querySelector('.close-popup');
        closeButton.addEventListener('click', () => popup.remove());
        popup.addEventListener('click', (e) => {
            if (e.target === popup) popup.remove();
        });
    };

    // Update the processVIPPurchase function
    window.processVIPPurchase = async function(planId) {
        try {
            const username = Telegram.WebApp.initDataUnsafe.user?.username;
            if (!username) {
                showNotification('Please open this app through Telegram.', 'error');
                return;
            }

            const plan = VIP_PLANS[planId];
            if (!plan) {
                showNotification('Invalid plan selected.', 'error');
                return;
            }

            // Generate unique order ID
            const orderId = `VIP_${planId}_${Date.now()}`;
            
            // USDT Payment Address (replace with your actual USDT TRC20 address)
            const usdtAddress = 'YOUR_USDT_TRC20_ADDRESS';

            // Show payment options
            Telegram.WebApp.showPopup({
                title: 'Choose Payment Method',
                message: `Select payment method for ${plan.price} VIP (${plan.duration}):`,
                buttons: [
                    {
                        id: 'usdt_trc20',
                        type: 'default',
                        text: '💎 USDT (TRC20)'
                    },
                    {
                        id: 'usdt_manual',
                        type: 'default',
                        text: '💳 Manual USDT'
                    },
                    {
                        id: 'cancel',
                        type: 'cancel'
                    }
                ]
            }, async (buttonId) => {
                if (buttonId === 'cancel') return;

                // Store pending purchase in Firebase
                const purchaseRef = ref(db, `pending_purchases/${username}/${orderId}`);
                await set(purchaseRef, {
                    orderId: orderId,
                    planId: planId,
                    username: username,
                    amount: plan.priceInUSDT,
                    duration: plan.duration,
                    durationInDays: plan.durationInDays,
                    paymentMethod: buttonId,
                    status: 'pending',
                    timestamp: Date.now()
                });

                if (buttonId === 'usdt_trc20') {
                    // Show USDT TRC20 payment instructions
                    Telegram.WebApp.showPopup({
                        title: 'USDT Payment Details',
                        message: `Send ${plan.price} USDT (TRC20) to:\n\n${usdtAddress}\n\nOrder ID: ${orderId}\n\nAfter sending, contact @MowgliSupport with:\n1. Order ID\n2. Transaction Hash\n3. Your USDT wallet address`,
                        buttons: [
                            {
                                id: 'copy_address',
                                type: 'default',
                                text: '📋 Copy Address'
                            },
                            {
                                id: 'copy_orderid',
                                type: 'default',
                                text: '📋 Copy Order ID'
                            },
                            {
                                id: 'contact_support',
                                type: 'default',
                                text: '💬 Contact Support'
                            }
                        ]
                    }, (actionId) => {
                        if (actionId === 'copy_address') {
                            navigator.clipboard.writeText(usdtAddress);
                            showNotification('Address copied to clipboard');
                        } else if (actionId === 'copy_orderid') {
                            navigator.clipboard.writeText(orderId);
                            showNotification('Order ID copied to clipboard');
                        } else if (actionId === 'contact_support') {
                            window.open('https://t.me/MowgliSupport', '_blank');
                        }
                    });
                } else if (buttonId === 'usdt_manual') {
                    // Show manual payment instructions
                    Telegram.WebApp.showPopup({
                        title: 'Manual Payment',
                        message: `Contact @MowgliSupport to process your payment.\n\nOrder ID: ${orderId}\nAmount: ${plan.price}`,
                        buttons: [
                            {
                                id: 'copy_orderid',
                                type: 'default',
                                text: '📋 Copy Order ID'
                            },
                            {
                                id: 'contact_support',
                                type: 'default',
                                text: '💬 Contact Support'
                            }
                        ]
                    }, (actionId) => {
                        if (actionId === 'copy_orderid') {
                            navigator.clipboard.writeText(orderId);
                            showNotification('Order ID copied to clipboard');
                        } else if (actionId === 'contact_support') {
                            window.open('https://t.me/MowgliSupport', '_blank');
                        }
                    });
                }
            });

        } catch (error) {
            console.error('Payment error:', error);
            showNotification('Failed to process payment. Please try again.', 'error');
        }
    };

    // Add helper function for notifications
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Add VIP status checking function
    async function checkVIPStatus(username) {
        try {
            const userRef = ref(db, `users/${username}`);
            const snapshot = await get(userRef);
            const userData = snapshot.val();
            
            if (!userData?.vip) return null;
            
            const vipData = userData.vip;
            const now = Date.now();
            
            // Check if VIP is expired
            if (vipData.expiresAt < now) {
                // Clear expired VIP status
                await update(userRef, {
                    vip: null
                });
                return null;
            }
            
            return vipData;
        } catch (error) {
            console.error('Error checking VIP status:', error);
            return null;
        }
    }

    // Add function to apply VIP benefits to rewards
    async function applyVIPBenefits(username, baseReward) {
        const vipStatus = await checkVIPStatus(username);
        if (!vipStatus) return baseReward;
        
        return baseReward * VIP_BENEFITS.REWARD_MULTIPLIER;
    }

    // Update the giveAdReward function to include VIP benefits
    async function giveAdReward() {
        const baseReward = 1000;
        const username = Telegram.WebApp.initDataUnsafe.user?.username;
        
        if (!username) return;

        try {
            const userRef = ref(db, `users/${username}`);
            const snapshot = await get(userRef);
            const currentCoins = snapshot.val()?.coins || 0;
            
            // Apply VIP multiplier if applicable
            const finalReward = await applyVIPBenefits(username, baseReward);

            await update(userRef, {
                coins: currentCoins + finalReward,
                lastUpdated: Date.now()
            });

            Telegram.WebApp.showPopup({
                title: 'Reward Received!',
                message: finalReward > baseReward ? 
                    `You earned ${finalReward} coins! (2x VIP Bonus Applied!)` :
                    `You earned ${finalReward} coins!`
            });

            // Update displayed coins
            syncPoints();
        } catch (error) {
            console.error('Error giving reward:', error);
        }
    }

    // Add function to update UI based on VIP status
    async function updateVIPUI(username) {
        const vipStatus = await checkVIPStatus(username);
        const vipButton = document.querySelector('.vip-upgrade-button');
        
        if (vipStatus) {
            vipButton.innerHTML = `
                <i class="fas fa-crown"></i>
                <span>VIP Active</span>
                <div class="vip-benefits">2x Rewards Active</div>
            `;
            vipButton.classList.add('vip-active');
        } else {
            vipButton.innerHTML = `
                <i class="fas fa-crown"></i>
                <span>Upgrade to VIP</span>
                <div class="vip-benefits">2x Rewards</div>
            `;
            vipButton.classList.remove('vip-active');
        }
    }

    // Call this when page loads
    document.addEventListener('DOMContentLoaded', async () => {
        const username = Telegram.WebApp.initDataUnsafe.user?.username;
        if (username) {
            await updateVIPUI(username);
        }
    });

    // Add event listener for the daily login button
    document.addEventListener('DOMContentLoaded', () => {
        const dailyLoginButton = document.querySelector('[data-task-id="daily_login"]');
        if (dailyLoginButton) {
            dailyLoginButton.addEventListener('click', handleTaskLinkClick);
        }
        // ... rest of your DOMContentLoaded code
    });

    // Add this function to handle Adgram ads
    window.handleAdgramAd = async function() {
        const now = Date.now();
        if (now - lastAdTime < adCooldown) {
            const remainingTime = Math.ceil((adCooldown - (now - lastAdTime)) / 1000);
            Telegram.WebApp.showPopup({
                title: 'Please Wait',
                message: `You can watch another ad in ${remainingTime} seconds`,
                buttons: [{type: "ok"}]
            });
            return;
        }

        try {
            // Initialize Adgram
            window.sad.init({
                onAdLoaded: () => {
                    console.log('Ad loaded successfully');
                },
                onAdCompleted: () => {
                    lastAdTime = Date.now();
                    giveAdReward();
                },
                onAdError: (error) => {
                    console.error('Ad error:', error);
                    Telegram.WebApp.showPopup({
                        title: 'Error',
                        message: 'Failed to load ad. Please try again later.',
                        buttons: [{type: "ok"}]
                    });
                }
            });

            // Show the ad
            window.sad.showAd();

        } catch (error) {
            console.error('Error showing ad:', error);
            Telegram.WebApp.showPopup({
                title: 'Error',
                message: 'Ad service is currently unavailable. Please try again later.',
                buttons: [{type: "ok"}]
            });
        }
    };
}); 