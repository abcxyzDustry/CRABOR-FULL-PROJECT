// cart.js - Cart management functionality
class CartManager {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.initCartEvents();
        this.updateCartCount();
    }

    initCartEvents() {
        // Add to cart buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-cart')) {
                const button = e.target.closest('.add-to-cart');
                const productId = button.dataset.productId;
                const productName = button.dataset.productName;
                const productPrice = parseInt(button.dataset.productPrice);
                
                this.addToCart({
                    id: productId,
                    name: productName,
                    price: productPrice
                });
                
                // Show notification from main app if available
                if (window.craborApp && window.craborApp.showNotification) {
                    window.craborApp.showNotification(`Đã thêm ${productName} vào giỏ hàng`, 'success');
                } else {
                    alert(`Đã thêm ${productName} vào giỏ hàng!`);
                }
            }
        });

        // Cart sidebar functionality
        const cartButton = document.getElementById('cartButton');
        const cartSidebar = document.getElementById('cartSidebar');
        const closeCart = document.getElementById('closeCart');
        
        if (cartButton && cartSidebar) {
            cartButton.addEventListener('click', (e) => {
                e.preventDefault();
                cartSidebar.classList.add('active');
                this.updateCartDisplay();
            });
        }
        
        if (closeCart && cartSidebar) {
            closeCart.addEventListener('click', () => {
                cartSidebar.classList.remove('active');
            });
        }

        // Handle quantity changes in cart
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quantity-btn')) {
                const productId = e.target.dataset.id;
                const item = this.cart.find(item => item.id === productId);
                
                if (e.target.classList.contains('plus')) {
                    item.quantity += 1;
                } else if (e.target.classList.contains('minus') && item.quantity > 1) {
                    item.quantity -= 1;
                }
                
                this.updateCart();
            }
            
            if (e.target.closest('.remove-item')) {
                const productId = e.target.closest('.remove-item').dataset.id;
                this.cart = this.cart.filter(item => item.id !== productId);
                this.updateCart();
            }
        });

        // Checkout button
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                if (this.cart.length === 0) {
                    alert('Giỏ hàng trống!');
                    return;
                }
                
                // Check authentication
                const user = localStorage.getItem('crabor_user');
                if (!user) {
                    alert('Vui lòng đăng nhập để thanh toán');
                    const loginModal = document.getElementById('loginModal');
                    if (loginModal) loginModal.style.display = 'flex';
                    return;
                }
                
                // Proceed to checkout
                alert('Chuyển đến trang thanh toán...');
                // In real app: window.location.href = '/checkout';
            });
        }
    }

    addToCart(product) {
        const existingItem = this.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                ...product,
                quantity: 1
            });
        }
        
        this.updateCart();
    }

    updateCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
        this.updateCartCount();
        this.updateCartDisplay();
    }

    updateCartCount() {
        const cartCountElements = document.querySelectorAll('.cart-count');
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        cartCountElements.forEach(el => {
            el.textContent = totalItems;
            el.style.display = totalItems > 0 ? 'flex' : 'none';
        });
    }

    updateCartDisplay() {
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        
        if (cartItems) {
            cartItems.innerHTML = '';
            let total = 0;
            
            this.cart.forEach(item => {
                total += item.price * item.quantity;
                
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `
                    <img src="https://via.placeholder.com/60" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${item.price.toLocaleString()}đ</div>
                    </div>
                    <div class="cart-item-actions">
                        <button class="quantity-btn minus" data-id="${item.id}">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn plus" data-id="${item.id}">+</button>
                        <button class="remove-item" data-id="${item.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                cartItems.appendChild(cartItem);
            });
        }
        
        if (cartTotal) {
            const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            cartTotal.textContent = total.toLocaleString() + 'đ';
        }
    }

    getCartTotal() {
        return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    clearCart() {
        this.cart = [];
        this.updateCart();
    }
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cartManager = new CartManager();
});
