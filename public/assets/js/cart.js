// public/assets/js/cart.js
function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    craborApp.updateCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
    craborApp.showNotification(`Đã thêm ${product.name} vào giỏ hàng`, 'success');
}

function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    craborApp.updateCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
    craborApp.showNotification('Đã xóa sản phẩm khỏi giỏ hàng', 'info');
}

function updateCartItemQuantity(productId, quantity) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = quantity;
            localStorage.setItem('cart', JSON.stringify(cart));
            craborApp.updateCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
        }
    }
}

function getCartTotal() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function clearCart() {
    localStorage.removeItem('cart');
    craborApp.updateCartCount(0);
}

// Gắn vào window để các trang khác dùng được
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartItemQuantity = updateCartItemQuantity;
window.getCartTotal = getCartTotal;
window.clearCart = clearCart;
