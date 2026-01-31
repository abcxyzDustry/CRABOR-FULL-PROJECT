// users.js - User profile management
class UserManager {
    constructor() {
        this.currentUser = null;
        this.initUserEvents();
        this.loadUserProfile();
    }

    initUserEvents() {
        // Profile form submission
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', this.handleProfileUpdate.bind(this));
        }

        // Password change form
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', this.handlePasswordChange.bind(this));
        }

        // Avatar upload
        const avatarInput = document.getElementById('avatarInput');
        if (avatarInput) {
            avatarInput.addEventListener('change', this.handleAvatarUpload.bind(this));
        }

        // Address management
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-address-btn')) {
                this.showAddressForm();
            }
            
            if (e.target.closest('.edit-address-btn')) {
                const addressId = e.target.closest('.edit-address-btn').dataset.addressId;
                this.editAddress(addressId);
            }
            
            if (e.target.closest('.delete-address-btn')) {
                const addressId = e.target.closest('.delete-address-btn').dataset.addressId;
                this.deleteAddress(addressId);
            }
            
            if (e.target.closest('.set-default-address')) {
                const addressId = e.target.closest('.set-default-address').dataset.addressId;
                this.setDefaultAddress(addressId);
            }
        });
    }

    async loadUserProfile() {
        try {
            const token = localStorage.getItem('crabor_token');
            if (!token) return;

            const response = await fetch('/api/users/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                this.currentUser = await response.json();
                this.displayUserProfile(this.currentUser);
                this.loadUserAddresses();
                this.loadUserOrders();
            }
        } catch (error) {
            console.error('Failed to load user profile:', error);
        }
    }

    displayUserProfile(user) {
        // Update profile form fields
        const nameInput = document.getElementById('profileName');
        const emailInput = document.getElementById('profileEmail');
        const phoneInput = document.getElementById('profilePhone');
        const avatarElement = document.querySelector('.user-avatar');

        if (nameInput) nameInput.value = user.name || '';
        if (emailInput) emailInput.value = user.email || '';
        if (phoneInput) phoneInput.value = user.phone || '';

        if (avatarElement) {
            if (user.avatar) {
                avatarElement.innerHTML = `<img src="${user.avatar}" alt="${user.name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
            } else {
                avatarElement.textContent = (user.name || user.email).charAt(0).toUpperCase();
            }
        }

        // Update sidebar user info
        const sidebarName = document.querySelector('.user-name');
        const sidebarAvatar = document.querySelector('.sidebar-user-avatar');
        
        if (sidebarName) sidebarName.textContent = user.name || user.email;
        if (sidebarAvatar) {
            if (user.avatar) {
                sidebarAvatar.innerHTML = `<img src="${user.avatar}" alt="${user.name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
            } else {
                sidebarAvatar.textContent = (user.name || user.email).charAt(0).toUpperCase();
            }
        }
    }

    async handleProfileUpdate(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
        submitBtn.disabled = true;

        try {
            const token = localStorage.getItem('crabor_token');
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                // Update local storage
                const currentUser = JSON.parse(localStorage.getItem('crabor_user'));
                localStorage.setItem('crabor_user', JSON.stringify({
                    ...currentUser,
                    ...data
                }));
                
                // Update current user
                this.currentUser = { ...this.currentUser, ...data };
                
                // Show success message
                if (window.craborApp && window.craborApp.showNotification) {
                    window.craborApp.showNotification('Cập nhật thông tin thành công', 'success');
                }
            } else {
                throw new Error(result.error || 'Cập nhật thất bại');
            }
        } catch (error) {
            console.error('Profile update failed:', error);
            if (window.craborApp && window.craborApp.showNotification) {
                window.craborApp.showNotification(error.message, 'error');
            }
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async handlePasswordChange(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Validate passwords match
        if (data.newPassword !== data.confirmPassword) {
            if (window.craborApp && window.craborApp.showNotification) {
                window.craborApp.showNotification('Mật khẩu mới không khớp', 'error');
            }
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đổi mật khẩu...';
        submitBtn.disabled = true;

        try {
            const token = localStorage.getItem('crabor_token');
            const response = await fetch('/api/users/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: data.currentPassword,
                    newPassword: data.newPassword
                })
            });

            const result = await response.json();

            if (response.ok) {
                if (window.craborApp && window.craborApp.showNotification) {
                    window.craborApp.showNotification('Đổi mật khẩu thành công', 'success');
                }
                form.reset();
            } else {
                throw new Error(result.error || 'Đổi mật khẩu thất bại');
            }
        } catch (error) {
            console.error('Password change failed:', error);
            if (window.craborApp && window.craborApp.showNotification) {
                window.craborApp.showNotification(error.message, 'error');
            }
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type and size
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!validTypes.includes(file.type)) {
            if (window.craborApp && window.craborApp.showNotification) {
                window.craborApp.showNotification('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF)', 'error');
            }
            return;
        }

        if (file.size > maxSize) {
            if (window.craborApp && window.craborApp.showNotification) {
                window.craborApp.showNotification('Kích thước file không được vượt quá 5MB', 'error');
            }
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const token = localStorage.getItem('crabor_token');
            const response = await fetch('/api/users/upload-avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                // Update local storage
                const currentUser = JSON.parse(localStorage.getItem('crabor_user'));
                currentUser.avatar = result.avatarUrl;
                localStorage.setItem('crabor_user', JSON.stringify(currentUser));
                
                // Update current user
                this.currentUser.avatar = result.avatarUrl;
                
                // Update UI
                this.displayUserProfile(this.currentUser);
                
                // Show success message
                if (window.craborApp && window.craborApp.showNotification) {
                    window.craborApp.showNotification('Cập nhật ảnh đại diện thành công', 'success');
                }
            } else {
                throw new Error(result.error || 'Tải ảnh lên thất bại');
            }
        } catch (error) {
            console.error('Avatar upload failed:', error);
            if (window.craborApp && window.craborApp.showNotification) {
                window.craborApp.showNotification(error.message, 'error');
            }
        }
    }

    async loadUserAddresses() {
        try {
            const token = localStorage.getItem('crabor_token');
            const response = await fetch('/api/users/addresses', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const addresses = await response.json();
                this.displayUserAddresses(addresses);
            }
        } catch (error) {
            console.error('Failed to load addresses:', error);
        }
    }

    displayUserAddresses(addresses) {
        const container = document.getElementById('addressList');
        if (!container) return;

        if (addresses.length === 0) {
            container.innerHTML = `
                <div class="no-addresses">
                    <i class="fas fa-map-marker-alt" style="font-size: 3rem; color: #dee2e6;"></i>
                    <p>Chưa có địa chỉ nào</p>
                    <button class="btn btn-primary add-address-btn">Thêm địa chỉ mới</button>
                </div>
            `;
            return;
        }

        container.innerHTML = addresses.map(address => `
            <div class="address-card ${address.isDefault ? 'default-address' : ''}">
                <div class="address-header">
                    <h4>${address.label || 'Địa chỉ nhà'}</h4>
                    ${address.isDefault ? '<span class="badge badge-primary">Mặc định</span>' : ''}
                </div>
                
                <div class="address-content">
                    <p><strong>${address.name}</strong> | ${address.phone}</p>
                    <p>${address.address}, ${address.ward}, ${address.district}, ${address.city}</p>
                    <p class="text-muted">${address.notes || ''}</p>
                </div>
                
                <div class="address-actions">
                    ${!address.isDefault ? `
                        <button class="btn btn-sm btn-outline set-default-address" data-address-id="${address._id}">
                            Đặt làm mặc định
                        </button>
                    ` : ''}
                    
                    <button class="btn btn-sm btn-outline edit-address-btn" data-address-id="${address._id}">
                        Sửa
                    </button>
                    
                    <button class="btn btn-sm btn-outline-danger delete-address-btn" data-address-id="${address._id}">
                        Xóa
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadUserOrders() {
        try {
            const token = localStorage.getItem('crabor_token');
            const response = await fetch('/api/users/orders?limit=10', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const orders = await response.json();
                this.displayUserOrders(orders);
            }
        } catch (error) {
            console.error('Failed to load user orders:', error);
        }
    }

    displayUserOrders(orders) {
        const container = document.getElementById('userOrders');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="no-orders">
                    <i class="fas fa-shopping-bag" style="font-size: 3rem; color: #dee2e6;"></i>
                    <p>Chưa có đơn hàng nào</p>
                </div>
            `;
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="order-item">
                <div class="order-header">
                    <span class="order-id">#${order.orderNumber}</span>
                    <span class="order-status status-${order.status}">
                        ${this.getStatusText(order.status)}
                    </span>
                </div>
                
                <div class="order-details">
                    <div class="order-restaurant">${order.restaurantName}</div>
                    <div class="order-items">${order.items.length} món</div>
                    <div class="order-total">${this.formatCurrency(order.total)}</div>
                </div>
                
                <div class="order-time">${this.formatDate(order.createdAt)}</div>
                
                <div class="order-actions">
                    <button class="btn btn-sm btn-outline" onclick="window.location.href='/orders/${order._id}'">
                        Xem chi tiết
                    </button>
                    
                    ${order.status === 'pending' ? `
                        <button class="btn btn-sm btn-danger cancel-order-btn" data-order-id="${order._id}">
                            Hủy đơn
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    showAddressForm(address = null) {
        // Implementation for address form modal
        console.log('Show address form for:', address);
        // In real app: open modal with address form
    }

    async editAddress(addressId) {
        try {
            const token = localStorage.getItem('crabor_token');
            const response = await fetch(`/api/users/addresses/${addressId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const address = await response.json();
                this.showAddressForm(address);
            }
        } catch (error) {
            console.error('Failed to load address:', error);
        }
    }

    async deleteAddress(addressId) {
        if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;

        try {
            const token = localStorage.getItem('crabor_token');
            const response = await fetch(`/api/users/addresses/${addressId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                if (window.craborApp && window.craborApp.showNotification) {
                    window.craborApp.showNotification('Đã xóa địa chỉ', 'success');
                }
                this.loadUserAddresses();
            }
        } catch (error) {
            console.error('Failed to delete address:', error);
        }
    }

    async setDefaultAddress(addressId) {
        try {
            const token = localStorage.getItem('crabor_token');
            const response = await fetch(`/api/users/addresses/${addressId}/set-default`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                if (window.craborApp && window.craborApp.showNotification) {
                    window.craborApp.showNotification('Đã đặt làm địa chỉ mặc định', 'success');
                }
                this.loadUserAddresses();
            }
        } catch (error) {
            console.error('Failed to set default address:', error);
        }
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'Chờ xác nhận',
            'accepted': 'Đã xác nhận',
            'preparing': 'Đang chuẩn bị',
            'ready': 'Sẵn sàng giao',
            'delivering': 'Đang giao hàng',
            'completed': 'Hoàn thành',
            'cancelled': 'Đã hủy'
        };
        
        return statusMap[status] || status;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    }
}

// Initialize user manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.userManager = new UserManager();
});
