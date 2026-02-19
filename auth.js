// Check protection on index.html
if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
    if (localStorage.getItem("netstream_logged_in") !== "true") {
        window.location.href = 'register.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Register Form Handling
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, phone, password })
                });

                const data = await response.json();
                if (data.success) {
                    alert("Registration successful");
                    window.location.href = 'login.html';
                } else {
                    alert(data.message || "Registration failed");
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert("Server error, please try again.");
            }
        });
    }

    // Login Form Handling
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const errorEl = document.getElementById('error-message');

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();
                if (data.success) {
                    localStorage.setItem("netstream_logged_in", "true");
                    window.location.href = 'index.html';
                } else {
                    if (errorEl) {
                        errorEl.textContent = data.message || "Invalid username or password";
                        errorEl.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error('Login error:', error);
                if (errorEl) {
                    errorEl.textContent = "Server error, please try again.";
                    errorEl.style.display = 'block';
                }
            }
        });
    }

    // Logout Handling
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem("netstream_logged_in");
            window.location.href = 'login.html';
        });
    }
});
