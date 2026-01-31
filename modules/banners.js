// modules/banners.js
const Banner = {
    async getActiveBanners() {
        try {
            const response = await fetch('/api/banners/active');
            if (!response.ok) throw new Error('Failed to fetch banners');
            return await response.json();
        } catch (error) {
            console.error('Error fetching active banners:', error);
            return [];
        }
    },

    async createBanner(bannerData) {
        try {
            const response = await fetch('/api/banners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bannerData)
            });
            if (!response.ok) throw new Error('Failed to create banner');
            return await response.json();
        } catch (error) {
            console.error('Error creating banner:', error);
            throw error;
        }
    }
};

// Nếu dùng module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Banner;
} else {
    window.Banner = Banner;
}
