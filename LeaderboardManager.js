import { getDatabase, ref, query, orderByChild, limitToLast } from 'firebase/database';

export class LeaderboardManager {
    constructor() {
        this.db = getDatabase();
        this.leaderboardSize = 100;
        this.categories = {
            COINS: 'coins',
            CLICKS: 'clicks',
            REFERRALS: 'referrals'
        };
    }

    async getLeaderboard(category) {
        const leaderboardRef = ref(this.db, 'users');
        const leaderboardQuery = query(
            leaderboardRef,
            orderByChild(category),
            limitToLast(this.leaderboardSize)
        );

        const snapshot = await get(leaderboardQuery);
        const leaders = [];

        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                leaders.unshift({
                    username: childSnapshot.key,
                    score: childSnapshot.val()[category]
                });
            });
        }

        return leaders;
    }

    createLeaderboardElement(leaders) {
        const container = document.createElement('div');
        container.className = 'leaderboard-container';

        const html = `
            <div class="leaderboard-header">
                <h3>Top Players</h3>
                <div class="leaderboard-tabs">
                    ${Object.values(this.categories).map(category => `
                        <button class="leaderboard-tab" data-category="${category}">
                            ${category.charAt(0).toUpperCase() + category.slice(1)}
                        </button>
                    `).join('')}
                </div>
            </div>
            <div class="leaderboard-list">
                ${leaders.map((leader, index) => `
                    <div class="leaderboard-item ${index < 3 ? 'top-three' : ''}">
                        <span class="rank">${index + 1}</span>
                        <span class="username">${leader.username}</span>
                        <span class="score">${leader.score.toLocaleString()}</span>
                    </div>
                `).join('')}
            </div>
        `;

        container.innerHTML = html;
        return container;
    }
} 