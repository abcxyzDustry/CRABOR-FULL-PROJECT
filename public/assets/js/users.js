// public/assets/js/users.js
async function updateProfile(userData) {
    try {
        const response = await craborApp.apiRequest('/api/users/profile', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
        const currentUser = JSON.parse(localStorage.getItem('crabor_user'));
        localStorage.setItem('crabor_user', JSON.stringify({ ...currentUser, ...userData }));
        craborApp.showNotification('Cập nhật thông tin thành công', 'success');
        return response;
    } catch (error) {
        craborApp.showNotification('Cập nhật thất bại: ' + error.message, 'error');
        throw error;
    }
}

async function changePassword(currentPassword, newPassword) {
    try {
        const response = await craborApp.apiRequest('/api/users/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        });
        craborApp.showNotification('Đổi mật khẩu thành công', 'success');
        return response;
    } catch (error) {
        craborApp.showNotification('Đổi mật khẩu thất bại: ' + error.message, 'error');
        throw error;
    }
}

// Gắn vào window
window.updateProfile = updateProfile;
window.changePassword = changePassword;
