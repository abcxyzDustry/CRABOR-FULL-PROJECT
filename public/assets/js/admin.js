// public/assets/js/admin.js
async function loadAdminStats() {
    try {
        const stats = await craborApp.apiRequest('/api/admin/stats');
        craborApp.updateAdminStats(stats);
    } catch (error) {
        console.error('Failed to load admin stats:', error);
    }
}

async function loadRecentActivity() {
    try {
        const activity = await craborApp.apiRequest('/api/admin/activity');
        craborApp.displayRecentActivity(activity);
    } catch (error) {
        console.error('Failed to load recent activity:', error);
    }
}

// Gắn vào window
window.loadAdminStats = loadAdminStats;
window.loadRecentActivity = loadRecentActivity;
