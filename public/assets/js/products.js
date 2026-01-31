// products.js - Product management functionality
class ProductManager {
    constructor() {
        this.currentProducts = [];
        this.currentCategory = 'all';
        this.filters = {};
        this.initProductEvents();
        this.loadProducts();
        this.loadCategories();
    }

    initProductEvents() {
        // Category filter
        document.addEventListener('click', (e) => {
            if (e.target.closest('.category-filter')) {
                const category = e.target.closest('.category-filter').dataset.category;
                this.filterByCategory(category);
            }
        });

        // Search functionality
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.searchProducts(e.target.value);
            }, 300));
        }

        // Sort functionality
        const sortSelect = document.querySelector('.sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortProducts(e.target.value);
            });
        }

        // Add to cart buttons are handled by cart.js
    }

    async loadProducts(filters = {}) {
        try {
            const query = new URLSearchParams(filters).toString();
            const response = await fetch(`/api/products?${query}`);
            
            if (response.ok) {
                this.currentProducts = await response.json();
                this.displayProducts(this.currentProducts);
            }
        } catch (error) {
            console.error('Failed to load products:', error);
            // Fallback to sample data
            this.displaySampleProducts();
        }
    }

    async loadCategories() {
        try {
            const response = await fetch('/api/categories');
            if (response.ok) {
                const categories = await response.json();
                this.displayCategories(categories);
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
            // Fallback to sample categories
            this.displaySampleCategories();
        }
    }

    displayProducts(products) {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        if (products.length === 0) {
            productsGrid.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-search" style="font-size: 3rem; color: #dee2e6;"></i>
                    <p>Không tìm thấy sản phẩm phù hợp</p>
                </div>
            `;
            return;
        }

        productsGrid.innerHTML = products.map(product => `
            <div class="product-card">
                ${product.isFeatured ? '<div class="product-badge">Nổi bật</div>' : ''}
                ${product.discount > 0 ? `<div class="discount-badge">-${product.discount}%</div>` : ''}
                
                <img src="${product.image || 'https://via.placeholder.com/400x300'}" 
                     alt="${product.name}" 
                     class="product-image"
                     onerror="this.src='https://via.placeholder.com/400x300'">
                
                <div class="product-content">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description || ''}</p>
                    
                    <div class="product-rating">
                        ${this.generateRatingStars(product.rating || 0)}
                        <span class="rating-value">${(product.rating || 0).toFixed(1)}</span>
                    </div>
                    
                    <div class="product-footer">
                        <div class="product-price">
                            ${product.discount > 0 ? `
                                <span class="product-old-price">
                                    ${this.formatCurrency(product.originalPrice || product.price)}
                                </span>
                            ` : ''}
                            <span class="product-current-price">
                                ${this.formatCurrency(this.calculateDiscountedPrice(product))}
                            </span>
                        </div>
                        
                        <button class="add-to-cart"
                                data-product-id="${product._id || product.id}"
                                data-product-name="${product.name}"
                                data-product-price="${this.calculateDiscountedPrice(product)}"
                                data-product-image="${product.image}"
                                ${product.stock <= 0 ? 'disabled' : ''}>
                            <i class="fas fa-${product.stock <= 0 ? 'times' : 'plus'}"></i>
                        </button>
                    </div>
                    
                    ${product.stock <= 0 ? `
                        <div class="out-of-stock">Hết hàng</div>
                    ` : product.stock < 10 ? `
                        <div class="low-stock">Còn ${product.stock} sản phẩm</div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    displaySampleProducts() {
        const sampleProducts = [
            {
                id: 1,
                name: 'Pizza Hải Sản',
                description: 'Pizza hải sản tươi ngon với tôm, mực, thanh cua',
                price: 189000,
                originalPrice: 239000,
                image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
                rating: 4.5,
                isFeatured: true,
                discount: 20,
                stock: 15
            },
            {
                id: 2,
                name: 'Bánh Mì Thịt Nướng',
                description: 'Bánh mì thịt nướng đặc biệt với rau sống',
                price: 35000,
                image: 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400',
                rating: 4.8,
                stock: 30
            },
            {
                id: 3,
                name: 'Cơm Gà Xối Mỡ',
                description: 'Cơm gà giòn da, nước mắm tỏi ớt đặc biệt',
                price: 55000,
                image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400',
                rating: 4.7,
                stock: 25
            }
        ];
        
        this.displayProducts(sampleProducts);
    }

    displayCategories(categories) {
        const categoriesGrid = document.getElementById('categoriesGrid');
        if (!categoriesGrid) return;

        categoriesGrid.innerHTML = categories.map(category => `
            <div class="category-card category-filter" data-category="${category.id || category.name}">
                <div class="category-icon">${category.icon || '🍽️'}</div>
                <div class="category-name">${category.name}</div>
            </div>
        `).join('');
    }

    displaySampleCategories() {
        const sampleCategories = [
            { id: 1, name: 'Món chính', icon: '🍛' },
            { id: 2, name: 'Khai vị', icon: '🥗' },
            { id: 3, name: 'Đồ uống', icon: '🥤' },
            { id: 4, name: 'Tráng miệng', icon: '🍰' },
            { id: 5, name: 'Combo', icon: '🎁' },
            { id: 6, name: 'Đồ chay', icon: '🌱' }
        ];
        
        this.displayCategories(sampleCategories);
    }

    filterByCategory(category) {
        this.currentCategory = category;
        
        // Update active category UI
        document.querySelectorAll('.category-filter').forEach(card => {
            card.classList.remove('active');
        });
        
        const activeCard = document.querySelector(`[data-category="${category}"]`);
        if (activeCard) {
            activeCard.classList.add('active');
        }
        
        // Filter products
        if (category === 'all') {
            this.displayProducts(this.currentProducts);
        } else {
            const filtered = this.currentProducts.filter(product => 
                product.category === category || product.categoryId === category
            );
            this.displayProducts(filtered);
        }
    }

    async searchProducts(query) {
        if (!query.trim()) {
            this.displayProducts(this.currentProducts);
            return;
        }
        
        try {
            const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
            if (response.ok) {
                const results = await response.json();
                this.displayProducts(results);
            }
        } catch (error) {
            console.error('Search failed:', error);
            // Client-side search fallback
            const filtered = this.currentProducts.filter(product =>
                product.name.toLowerCase().includes(query.toLowerCase()) ||
                product.description.toLowerCase().includes(query.toLowerCase())
            );
            this.displayProducts(filtered);
        }
    }

    sortProducts(sortBy) {
        let sortedProducts = [...this.currentProducts];
        
        switch(sortBy) {
            case 'price-asc':
                sortedProducts.sort((a, b) => this.calculateDiscountedPrice(a) - this.calculateDiscountedPrice(b));
                break;
            case 'price-desc':
                sortedProducts.sort((a, b) => this.calculateDiscountedPrice(b) - this.calculateDiscountedPrice(a));
                break;
            case 'rating-desc':
                sortedProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'name-asc':
                sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'newest':
                sortedProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
        }
        
        this.displayProducts(sortedProducts);
    }

    calculateDiscountedPrice(product) {
        if (product.discount && product.discount > 0) {
            const discountAmount = (product.originalPrice || product.price) * (product.discount / 100);
            return (product.originalPrice || product.price) - discountAmount;
        }
        return product.price;
    }

    generateRatingStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let stars = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        // Half star
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize product manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productManager = new ProductManager();
});
