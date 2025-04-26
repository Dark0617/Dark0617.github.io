// Check authentication
document.addEventListener('DOMContentLoaded', function() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    
    // Redirect to login if not authenticated
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    // Display user name
    document.getElementById('user-name').textContent = `Welcome, ${currentUser.name}`;
    
    // Initialize the application
    initializeApp();
});

// Logout functionality
document.getElementById('logout-btn').addEventListener('click', function() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
});

// Initialize charts and state
let monthlyChart, categoryChart;
let expenses = [];
let monthlyBudget = 5000;

function initializeApp() {
    // Load user-specific expenses
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const userExpensesKey = `expenses_${currentUser.id}`;
    const userBudgetKey = `budget_${currentUser.id}`;
    
    expenses = JSON.parse(localStorage.getItem(userExpensesKey)) || [];
    monthlyBudget = parseInt(localStorage.getItem(userBudgetKey)) || 5000;
    
    // Initialize theme
    initializeTheme();
    
    // Initialize charts
    initializeCharts();
    
    // Update dashboard with user data
    updateDashboard();
    
    // Set up event listeners
    setupEventListeners();
}

// Theme toggle functionality
function initializeTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        themeToggleBtn.innerHTML = isDarkMode ? 
            '<i class="fas fa-sun"></i><span>Light Mode</span>' : 
            '<i class="fas fa-moon"></i><span>Dark Mode</span>';
        localStorage.setItem('darkMode', isDarkMode);
        
        // Update charts with new theme colors
        updateCharts();
    });
    
    // Initialize theme from localStorage
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
    }
}

// Initialize Charts
function initializeCharts() {
    const monthlyCtx = document.getElementById('monthly-chart').getContext('2d');
    const categoryCtx = document.getElementById('category-chart').getContext('2d');
    
    // Get theme-based colors
    const isDarkMode = document.body.classList.contains('dark-mode');
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    monthlyChart = new Chart(monthlyCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Monthly Expenses',
                data: [],
                borderColor: '#e53935',
                backgroundColor: 'rgba(229, 57, 53, 0.1)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => '₹' + value
                    },
                    grid: {
                        color: gridColor
                    }
                },
                x: {
                    grid: {
                        color: gridColor
                    }
                }
            }
        }
    });

    categoryChart = new Chart(categoryCtx, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#FF6384', '#36A2EB', '#FFCE56'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Set up event listeners
function setupEventListeners() {
    // Handle expense form submission
    document.getElementById('expense-form').addEventListener('submit', (e) => {
        e.preventDefault();
        addNewExpense();
    });
    
    // Handle budget form
    document.getElementById('set-budget-btn').addEventListener('click', () => {
        document.getElementById('budget-modal').style.display = 'block';
        document.getElementById('budget-amount').value = monthlyBudget;
    });
    
    document.getElementById('budget-form').addEventListener('submit', (e) => {
        e.preventDefault();
        updateBudget();
    });
    
    // Search and filter functionality
    document.getElementById('search-expenses').addEventListener('input', renderExpensesList);
    document.getElementById('filter-category').addEventListener('change', renderExpensesList);
    
    // Export to CSV
    document.getElementById('export-csv').addEventListener('click', exportToCSV);
    
    // Close buttons
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('budget-modal').style.display = 'none';
    });
    
    document.querySelector('.close-notification').addEventListener('click', () => {
        document.getElementById('notification').style.display = 'none';
    });
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expense-date').value = today;
}

// Add new expense
function addNewExpense() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    
    const expense = {
        id: Date.now(),
        name: document.getElementById('expense-name').value,
        amount: parseFloat(document.getElementById('expense-amount').value),
        category: document.getElementById('expense-category').value,
        date: document.getElementById('expense-date').value,
        notes: document.getElementById('expense-notes').value,
        userId: currentUser.id
    };

    expenses.push(expense);
    saveExpenses();
    document.getElementById('expense-form').reset();
    
    // Set default date to today again after reset
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expense-date').value = today;
    
    updateDashboard();
    showNotification('Expense added successfully!');
}

// Update budget
function updateBudget() {
    monthlyBudget = parseFloat(document.getElementById('budget-amount').value);
    
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const userBudgetKey = `budget_${currentUser.id}`;
    
    localStorage.setItem(userBudgetKey, monthlyBudget);
    document.getElementById('budget-modal').style.display = 'none';
    
    updateDashboard();
    showNotification('Budget updated successfully!');
}

// Save expenses to localStorage
function saveExpenses() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const userExpensesKey = `expenses_${currentUser.id}`;
    
    localStorage.setItem(userExpensesKey, JSON.stringify(expenses));
}

// Update dashboard
function updateDashboard() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const monthlyExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && 
               expenseDate.getFullYear() === currentYear;
    });

    const totalSpent = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const remaining = monthlyBudget - totalSpent;

    document.getElementById('total-spent').textContent = totalSpent.toFixed(2);
    document.getElementById('monthly-budget').textContent = monthlyBudget.toFixed(2);
    document.getElementById('remaining').textContent = remaining.toFixed(2);

    const progressPercentage = (totalSpent / monthlyBudget) * 100;
    document.getElementById('budget-progress').style.width = `${Math.min(progressPercentage, 100)}%`;
    
    // Change progress bar color based on percentage
    const progressBar = document.getElementById('budget-progress');
    if (progressPercentage > 90) {
        progressBar.style.backgroundColor = 'var(--danger-color)';
    } else if (progressPercentage > 70) {
        progressBar.style.backgroundColor = 'var(--warning-color)';
    } else {
        progressBar.style.backgroundColor = 'var(--primary-color)';
    }

    // Check budget threshold and show notification
    if (remaining < 0) {
        showNotification('Warning: You have exceeded your monthly budget!', 'error');
    } else if (remaining < monthlyBudget * 0.1) {
        showNotification('Warning: You have less than 10% of your budget remaining!', 'warning');
    }

    updateCharts();
    renderExpensesList();
}

// Update charts with current data
function updateCharts() {
    const monthlyData = getMonthlyData();
    const categoryData = getCategoryData();

    monthlyChart.data.labels = monthlyData.labels;
    monthlyChart.data.datasets[0].data = monthlyData.values;
    monthlyChart.update();

    categoryChart.data.labels = categoryData.labels;
    categoryChart.data.datasets[0].data = categoryData.values;
    categoryChart.update();
}

// Get monthly data for charts
function getMonthlyData() {
    const monthlyTotals = {};
    
    // Sort expenses by date
    const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sortedExpenses.forEach(expense => {
        const date = new Date(expense.date);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        
        if (!monthlyTotals[monthYear]) {
            monthlyTotals[monthYear] = 0;
        }
        
        monthlyTotals[monthYear] += expense.amount;
    });

    return {
        labels: Object.keys(monthlyTotals),
        values: Object.values(monthlyTotals)
    };
}

// Get category data for charts
function getCategoryData() {
    const categoryTotals = {};
    
    expenses.forEach(expense => {
        if (!categoryTotals[expense.category]) {
            categoryTotals[expense.category] = 0;
        }
        
        categoryTotals[expense.category] += expense.amount;
    });

    return {
        labels: Object.keys(categoryTotals),
        values: Object.values(categoryTotals)
    };
}

// Render expenses list with search and filter
function renderExpensesList() {
    const searchTerm = document.getElementById('search-expenses').value.toLowerCase();
    const filterCategory = document.getElementById('filter-category').value;
    
    const filteredExpenses = expenses.filter(expense => {
        const matchesSearch = expense.name.toLowerCase().includes(searchTerm);
        const matchesCategory = !filterCategory || expense.category === filterCategory;
        return matchesSearch && matchesCategory;
    });
    
    // Sort expenses by date (newest first)
    filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    const tbody = document.getElementById('expenses-list');
    tbody.innerHTML = '';
    
    filteredExpenses.forEach(expense => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(expense.date)}</td>
            <td>${expense.name}</td>
            <td>${expense.category}</td>
            <td>₹${expense.amount.toFixed(2)}</td>
            <td>
                <button onclick="deleteExpense(${expense.id})" class="small-btn" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
                <button onclick="viewExpenseDetails(${expense.id})" class="small-btn" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('no-expenses-message').style.display = 
        filteredExpenses.length === 0 ? 'block' : 'none';
    document.getElementById('expenses-table').style.display = 
        filteredExpenses.length === 0 ? 'none' : 'table';
}

// Format date for display
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Delete expense
function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(expense => expense.id !== id);
        saveExpenses();
        updateDashboard();
        showNotification('Expense deleted successfully!');
    }
}

// View expense details
function viewExpenseDetails(id) {
    const expense = expenses.find(e => e.id === id);
    if (expense) {
        alert(`
            Name: ${expense.name}
            Amount: ₹${expense.amount.toFixed(2)}
            Category: ${expense.category}
            Date: ${formatDate(expense.date)}
            Notes: ${expense.notes || 'No notes'}
        `);
    }
}

// Export to CSV
function exportToCSV() {
    if (expenses.length === 0) {
        showNotification('No expenses to export!', 'warning');
        return;
    }
    
    const headers = ['Date', 'Name', 'Category', 'Amount (₹)', 'Notes'];
    
    // Sort expenses by date before export
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const csvContent = [
        headers.join(','),
        ...sortedExpenses.map(expense => [
            expense.date,
            `"${expense.name.replace(/"/g, '""')}"`, // Handle quotes in text
            expense.category,
            expense.amount.toFixed(2),
            `"${(expense.notes || '').replace(/"/g, '""')}"` // Handle quotes in text
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Create filename with current date
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `expenses_${today}.csv`;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Expenses exported successfully!');
}

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



// Make functions available globally
window.deleteExpense = deleteExpense;
window.viewExpenseDetails = viewExpenseDetails;