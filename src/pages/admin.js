import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js";
import { getDatabase, ref, onValue, get, set, update, query, orderByChild } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js";

// Initialize Firebase (use your config)
const firebaseConfig = {
    // Your Firebase config here
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Admin authentication (replace with your actual admin authentication)
const ADMIN_USERNAMES = ['MowgliSupport']; // You can add multiple admins like: ['admin1', 'admin2', 'MowgliSupport']

document.addEventListener('DOMContentLoaded', () => {
    const username = Telegram.WebApp.initDataUnsafe.user?.username;
    
    if (!ADMIN_USERNAMES.includes(username)) {
        document.body.innerHTML = '<h1>Access Denied</h1>';
        return;
    }

    const ordersList = document.getElementById('ordersList');
    const statusFilter = document.getElementById('statusFilter');
    const refreshButton = document.getElementById('refreshButton');

    // Load orders
    async function loadOrders(status = 'all') {
        try {
            const purchasesRef = ref(db, 'pending_purchases');
            const snapshot = await get(purchasesRef);
            
            ordersList.innerHTML = '';
            
            if (snapshot.exists()) {
                const orders = [];
                snapshot.forEach(userSnapshot => {
                    const username = userSnapshot.key;
                    userSnapshot.forEach(orderSnapshot => {
                        const order = orderSnapshot.val();
                        order.username = username;
                        orders.push(order);
                    });
                });

                // Sort orders by timestamp (newest first)
                orders.sort((a, b) => b.timestamp - a.timestamp);

                // Filter orders by status if needed
                const filteredOrders = status === 'all' ? 
                    orders : 
                    orders.filter(order => order.status === status);

                filteredOrders.forEach(order => {
                    const orderCard = createOrderCard(order);
                    ordersList.appendChild(orderCard);
                });
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            showNotification('Failed to load orders', 'error');
        }
    }

    function createOrderCard(order) {
        const card = document.createElement('div');
        card.className = 'order-card';
        
        const timestamp = new Date(order.timestamp).toLocaleString();
        
        card.innerHTML = `
            <div class="order-info">
                <div class="order-header">
                    <span class="order-id">#${order.orderId}</span>
                    <span class="order-status status-${order.status}">${order.status.toUpperCase()}</span>
                </div>
                <div class="order-details">
                    <div class="order-detail">
                        <span class="detail-label">Username:</span>
                        <span>@${order.username}</span>
                    </div>
                    <div class="order-detail">
                        <span class="detail-label">Plan:</span>
                        <span>${order.duration}</span>
                    </div>
                    <div class="order-detail">
                        <span class="detail-label">Amount:</span>
                        <span>${order.amount} USDT</span>
                    </div>
                    <div class="order-detail">
                        <span class="detail-label">Payment:</span>
                        <span>${order.paymentMethod}</span>
                    </div>
                    <div class="order-detail">
                        <span class="detail-label">Date:</span>
                        <span>${timestamp}</span>
                    </div>
                </div>
            </div>
            <div class="order-actions">
                ${order.status === 'pending' ? `
                    <button class="action-button approve-button" onclick="approveOrder('${order.username}', '${order.orderId}')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="action-button cancel-button" onclick="cancelOrder('${order.username}', '${order.orderId}')">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                ` : ''}
            </div>
        `;
        
        return card;
    }

    // Add event listeners
    statusFilter.addEventListener('change', () => {
        loadOrders(statusFilter.value);
    });

    refreshButton.addEventListener('click', () => {
        loadOrders(statusFilter.value);
    });

    // Initial load
    loadOrders();

    // Add global functions for order actions
    window.approveOrder = async function(username, orderId) {
        try {
            const orderRef = ref(db, `pending_purchases/${username}/${orderId}`);
            const snapshot = await get(orderRef);
            const order = snapshot.val();

            if (!order) {
                showNotification('Order not found', 'error');
                return;
            }

            // Update order status
            await update(orderRef, {
                status: 'completed'
            });

            // Add VIP status to user
            const userRef = ref(db, `users/${username}`);
            await update(userRef, {
                vip: {
                    planId: order.planId,
                    expiresAt: Date.now() + (getDurationInMs(order.duration)),
                    status: 'active'
                }
            });

            showNotification('Order approved successfully');
            loadOrders(statusFilter.value);
        } catch (error) {
            console.error('Error approving order:', error);
            showNotification('Failed to approve order', 'error');
        }
    };

    window.cancelOrder = async function(username, orderId) {
        try {
            const orderRef = ref(db, `pending_purchases/${username}/${orderId}`);
            await update(orderRef, {
                status: 'cancelled'
            });

            showNotification('Order cancelled successfully');
            loadOrders(statusFilter.value);
        } catch (error) {
            console.error('Error cancelling order:', error);
            showNotification('Failed to cancel order', 'error');
        }
    };
});

// Helper functions
function getDurationInMs(duration) {
    const months = parseInt(duration.split(' ')[0]);
    return months * 30 * 24 * 60 * 60 * 1000; // Convert months to milliseconds
}

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