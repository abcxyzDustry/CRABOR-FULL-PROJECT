// public/assets/js/products.js
async function loadProducts(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    try {
        return await craborApp.apiRequest(`/api/products?${query}`);
    } catch (error) {
        console.error('Failed to load products:', error);
        return [];
    }
}

async function getProduct(productId) {
    try {
        return await craborApp.apiRequest(`/api/products/${productId}`);
    } catch (error) {
        console.error('Failed to get product:', error);
        return null;
    }
}

// Gắn vào window
window.loadProducts = loadProducts;
window.getProduct = getProduct;
