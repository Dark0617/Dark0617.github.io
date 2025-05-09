// User authentication system
document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show selected tab content
            tabContents.forEach(content => {
                content.classList.add('hidden');
                if (content.id === `${tabId}-tab`) {
                    content.classList.remove('hidden');
                }
            });
        });
    });
    
    // Login form submission
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        // Find user with matching email and password
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Store current user in session
            sessionStorage.setItem('currentUser', JSON.stringify({
                name: user.name,
                email: user.email,
                id: user.id
            }));
            
            showNotification('Login successful! Redirecting...');
            
            // Redirect to main app after short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showNotification('Invalid email or password!', 'error');
        }
    });
    
    // Register form submission
    document.getElementById('register-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        // Validate password match
        if (password !== confirmPassword) {
            showNotification('Passwords do not match!', 'error');
            return;
        }
        
        // Get existing users
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        // Check if email already exists
        if (users.some(user => user.email === email)) {
            showNotification('Email already registered!', 'error');
            return;
        }
        
        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password,
            createdAt: new Date().toISOString()
        };
        
        // Add to users array
        users.push(newUser);
        
        // Save to localStorage
        localStorage.setItem('users', JSON.stringify(users));
        
        showNotification('Registration successful! Please login.');
        
        // Reset form and switch to login tab
        document.getElementById('register-form').reset();
        document.querySelector('[data-tab="login"]').click();
    });
    
    // Check if user is already logged in
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
        window.location.href = 'index.html';
    }
    
    // Initialize theme from localStorage
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
});

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    
    notificationMessage.textContent = message;
    
    // Set notification color based on type
    if (type === 'error') {
        notification.style.borderLeft = '4px solid var(--danger-color)';
    } else if (type === 'warning') {
        notification.style.borderLeft = '4px solid var(--warning-color)';
    } else {
        notification.style.borderLeft = '4px solid var(--success-color)';
    }
    
    notification.style.display = 'block';
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Close notification when clicking X
document.querySelector('.close-notification').addEventListener('click', () => {
    document.getElementById('notification').style.display = 'none';
});