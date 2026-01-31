// public/assets/js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    const result = await response.json();
                    localStorage.setItem('crabor_token', result.token);
                    localStorage.setItem('crabor_user', JSON.stringify(result.user));
                    craborApp.showNotification('Đăng nhập thành công', 'success');
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    const error = await response.json();
                    craborApp.showNotification(error.error || 'Đăng nhập thất bại', 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                craborApp.showNotification('Đã xảy ra lỗi khi đăng nhập', 'error');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    craborApp.showNotification('Đăng ký thành công! Vui lòng đăng nhập.', 'success');
                    // Chuyển sang form đăng nhập nếu có cơ chế switch
                    if (typeof craborApp.switchToLogin === 'function') {
                        craborApp.switchToLogin();
                    }
                } else {
                    const error = await response.json();
                    craborApp.showNotification(error.error || 'Đăng ký thất bại', 'error');
                }
            } catch (error) {
                console.error('Register error:', error);
                craborApp.showNotification('Đã xảy ra lỗi khi đăng ký', 'error');
            }
        });
    }
});
