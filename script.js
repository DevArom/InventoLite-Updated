// Persistent users list (saved forever in browser)
let users = JSON.parse(localStorage.getItem("appUsers")) || [
    { username: "user1", password: "pass1" },
    { username: "user2", password: "pass2" }
];

function saveUsers() {
    localStorage.setItem("appUsers", JSON.stringify(users));
}

let inventory = [];

// Toast notifications (success/error/info)
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl text-white font-bold animate-slide-up transition-all ${
        type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'
    }`;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// Loading spinner for buttons
function showLoading(button) {
    button.disabled = true;
    button.innerHTML = '<span class="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>Loading...';
    button.classList.add('opacity-75', 'cursor-not-allowed');
}

function resetButton(button, originalText) {
    button.disabled = false;
    button.innerHTML = originalText;
    button.classList.remove('opacity-75', 'cursor-not-allowed');
}

// Get current logged-in user
function getCurrentUser() {
    return localStorage.getItem("currentUser");
}

// Login function (with loading + smart messages)
function loginUser() {
    const username = document.getElementById("username")?.value.trim();
    const password = document.getElementById("password")?.value;
    const messageEl = document.getElementById("message");
    const btn = document.querySelector("#loginForm button[type='submit']");
    const originalText = btn ? btn.innerHTML : "Login";

    if (btn) showLoading(btn);

    setTimeout(() => {
        if (!username || !password) {
            if (messageEl) {
                messageEl.innerText = "Please enter username and password.";
                messageEl.className = "text-red-500 font-bold mt-4";
            }
            showToast("All fields required", "error");
            if (btn) resetButton(btn, originalText);
            return false;
        }

        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            localStorage.setItem("currentUser", username);
            if (messageEl) {
                messageEl.innerText = "Login successful! Redirecting...";
                messageEl.className = "text-green-500 font-bold mt-4";
            }
            showToast("Login successful! 🚀", "success");
            setTimeout(() => window.location.href = "inventory.html", 1200);
        } else {
            if (messageEl) {
                messageEl.innerText = "Invalid username or password.";
                messageEl.className = "text-red-500 font-bold mt-4";
            }
            showToast("Login failed - check credentials", "error");
            if (btn) resetButton(btn, originalText);
        }
    }, 800);

    return false;
}

// Registration (new users saved permanently)
function registerUser() {
    const username = document.getElementById("newUsername")?.value.trim();
    const password = document.getElementById("newPassword")?.value;
    const confirm = document.getElementById("confirmPassword")?.value;
    const messageEl = document.getElementById("registerMessage");
    const btn = document.querySelector("#registerForm button[type='submit']");
    const originalText = btn ? btn.innerHTML : "Register";

    if (btn) showLoading(btn);

    setTimeout(() => {
        if (!username || !password || !confirm) {
            if (messageEl) {
                messageEl.innerText = "All fields are required.";
                messageEl.className = "text-red-500 mt-4";
            }
            if (btn) resetButton(btn, originalText);
            return false;
        }
        if (password !== confirm) {
            if (messageEl) {
                messageEl.innerText = "Passwords do not match.";
                messageEl.className = "text-red-500 mt-4";
            }
            if (btn) resetButton(btn, originalText);
            return false;
        }
        if (password.length < 4) {
            if (messageEl) {
                messageEl.innerText = "Password must be at least 4 characters.";
                messageEl.className = "text-red-500 mt-4";
            }
            if (btn) resetButton(btn, originalText);
            return false;
        }
        if (users.some(u => u.username === username)) {
            if (messageEl) {
                messageEl.innerText = "Username already taken.";
                messageEl.className = "text-red-500 mt-4";
            }
            showToast("Username taken - try another", "error");
            if (btn) resetButton(btn, originalText);
            return false;
        }

        users.push({ username, password });
        saveUsers();
        showToast("Account created successfully! 🎉", "success");
        if (messageEl) {
            messageEl.innerText = "Registration successful! Redirecting to login...";
            messageEl.className = "text-green-500 font-bold mt-4";
        }
        setTimeout(() => window.location.href = "index.html", 2000);
        if (btn) resetButton(btn, originalText);
    }, 800);

    return false;
}

// Logout
function logoutUser() {
    localStorage.removeItem("currentUser");
    showToast("Logged out successfully", "success");
    setTimeout(() => window.location.href = "index.html", 1000);
}

// SMART Welcome message (First login vs Returning)
function checkAuth() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    const welcomeEl = document.getElementById("welcomeMessage");
    if (!welcomeEl) return;

    // Check if first login ever for this user
    const isFirstLogin = localStorage.getItem(`firstLogin_${user}`) === null;

    if (isFirstLogin) {
        welcomeEl.innerHTML = `
            <span class="block text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Welcome to InventoLite, ${user}! 👋
            </span>
            <span class="block text-xl md:text-2xl text-gray-300 mt-4 font-medium">
                Let's build your first inventory
            </span>
        `;
        // Mark as no longer first login
        localStorage.setItem(`firstLogin_${user}`, "done");
    } else {
        welcomeEl.innerHTML = `
            <span class="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Welcome back, ${user}! 😊
            </span>
            <span class="block text-lg md:text-xl text-gray-400 mt-2">
                Your inventory is ready
            </span>
        `;
    }
}

// Load inventory for current user
function loadInventory() {
    const user = getCurrentUser();
    if (!user) return;
    inventory = JSON.parse(localStorage.getItem(`inventory_${user}`)) || [];
    renderInventory();
}

// Save inventory for current user
function saveInventory() {
    const user = getCurrentUser();
    if (user) {
        localStorage.setItem(`inventory_${user}`, JSON.stringify(inventory));
    }
}

// Render table + LOW STOCK STATS + edit/delete buttons
function renderInventory() {
    const tableBody = document.getElementById("inventoryTable");
    const totalEl = document.getElementById("totalCount");
    const lowStockEl = document.getElementById("lowStockCount");
    const criticalEl = document.getElementById("criticalCount");
    const emptyEl = document.getElementById("emptyMessage");

    if (!tableBody) return;

    tableBody.innerHTML = "";
    let lowCount = 0;
    let criticalCount = 0;

    inventory.forEach((item, index) => {
        const row = document.createElement("tr");
        row.classList.add("hover:bg-gray-700/50", "transition", "cursor-pointer");

        // Low stock highlighting + counting
        if (item.quantity < 5) {
            row.classList.add("bg-red-900/50", "animate-pulse");
            criticalCount++;
        } else if (item.quantity < 10) {
            row.classList.add("bg-yellow-900/30");
            lowCount++;
        }

        row.innerHTML = `
            <td class="p-8 font-medium text-lg">${item.name}</td>
            <td class="p-8 text-center text-2xl font-bold ${item.quantity < 5 ? 'text-red-400' : item.quantity < 10 ? 'text-yellow-400' : 'text-green-400'}">${item.quantity}</td>
            <td class="p-8 text-center space-x-6">
                <button onclick="editItem(${index})" class="text-cyan-400 hover:text-cyan-300 font-bold text-xl px-4 py-2 bg-cyan-500/20 rounded-xl hover:bg-cyan-500/40 transition transform hover:scale-105">✏️ Edit</button>
                <button onclick="deleteItem(${index})" class="text-red-400 hover:text-red-300 font-bold text-xl px-4 py-2 bg-red-500/20 rounded-xl hover:bg-red-500/40 transition transform hover:scale-105">🗑️ Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // UPDATE STATS CARDS (THIS WAS MISSING!)
    if (totalEl) totalEl.innerText = inventory.length;
    if (lowStockEl) lowStockEl.innerText = lowCount + criticalCount;  // All low stock
    if (criticalEl) criticalEl.innerText = criticalCount;             // Critical only

    if (emptyEl) emptyEl.style.display = inventory.length ? "none" : "block";
}

// Add new product
function addItem() {
    const nameInput = document.getElementById("productName");
    const qtyInput = document.getElementById("productQuantity");
    
    const name = nameInput?.value.trim();
    const qty = parseInt(qtyInput?.value);

    if (name && !isNaN(qty) && qty >= 0) {
        inventory.push({ name, quantity: qty });
        saveInventory();
        renderInventory();
        showToast(`Added "${name}" successfully! ✅`, "success");
        nameInput.value = "";
        qtyInput.value = "";
    } else {
        showToast("Please enter valid name and quantity", "error");
    }
}

// Edit existing product (modal)
function editItem(index) {
    const item = inventory[index];
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4';
    
    modal.innerHTML = `
        <div class="glass rounded-3xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-8">
                <h3 class="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Edit Product</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-3xl text-gray-400 hover:text-white">&times;</button>
            </div>
            <div class="space-y-6">
                <input type="text" id="editName_${index}" value="${item.name}" class="w-full p-5 bg-gray-800/50 text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500 text-lg font-medium">
                <input type="number" id="editQty_${index}" value="${item.quantity}" min="0" class="w-full p-5 bg-gray-800/50 text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500 text-lg font-medium">
            </div>
            <div class="flex gap-4 mt-10">
                <button onclick="saveEdit(${index})" class="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 font-bold py-5 rounded-2xl text-lg transition transform hover:scale-105 shadow-xl">💾 Save Changes</button>
                <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-700 hover:bg-gray-600 font-bold py-5 rounded-2xl text-lg transition">❌ Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById(`editName_${index}`)?.focus();
}

// Save edited product
function saveEdit(index) {
    const nameInput = document.getElementById(`editName_${index}`);
    const qtyInput = document.getElementById(`editQty_${index}`);
    
    const newName = nameInput?.value.trim();
    const newQty = parseInt(qtyInput?.value);

    if (newName && !isNaN(newQty) && newQty >= 0) {
        inventory[index].name = newName;
        inventory[index].quantity = newQty;
        saveInventory();
        renderInventory();
        showToast(`Updated "${newName}" successfully! ✅`, "success");
        document.querySelector('.fixed')?.remove();
    } else {
        showToast("Please enter valid name and quantity", "error");
    }
}

// Delete product
function deleteItem(index) {
    if (confirm(`Delete "${inventory[index].name}"?`)) {
        inventory.splice(index, 1);
        saveInventory();
        renderInventory();
        showToast("Product deleted", "success");
    }
}

// Export CSV
function exportCSV() {
    if (!inventory.length) {
        showToast("No products to export", "error");
        return;
    }
    
    let csv = "Product Name,Quantity\n";
    inventory.forEach(item => {
        csv += `"${item.name.replace(/"/g, '""')}","${item.quantity}"\n`;
    });
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `InventoLite_Inventory_${getCurrentUser()}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast("Inventory exported successfully! 📄", "success");
}

// AI Reorder Assistant (Smart static AI)
function askAI() {
    if (!inventory.length) {
        showToast("Add products first to get AI suggestions! ✨", "info");
        return;
    }

    let suggestions = [];
    let lowStockItems = [];
    let criticalItems = [];

    inventory.forEach(item => {
        if (item.quantity < 5) {
            criticalItems.push(item);
            suggestions.push(`⚠️ <strong>CRITICAL:</strong> ${item.name} (${item.quantity}) → Reorder <strong>${Math.max(20, item.quantity * 4)}</strong> units URGENTLY`);
        } else if (item.quantity < 10) {
            lowStockItems.push(item);
            suggestions.push(`🟡 <strong>LOW:</strong> ${item.name} (${item.quantity}) → Restock <strong>${Math.max(15, item.quantity * 2.5)}</strong> units soon`);
        }
    });

    if (criticalItems.length === 0 && lowStockItems.length === 0) {
        suggestions = ["✅ <strong>All stock levels healthy!</strong><br>No immediate reorders needed. You're doing great! 💪"];
    }

    // AI Modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-md p-4';
    modal.innerHTML = `
        <div class="glass rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div class="flex justify-between items-center mb-8">
                <h3 class="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">🤖 AI Reorder Assistant</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-4xl text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition">&times;</button>
            </div>
            <div class="space-y-4 text-lg leading-relaxed">
                ${suggestions.map(s => `<div class="p-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30">${s}</div>`).join('')}
            </div>
            <div class="text-center mt-10 pt-8 border-t border-gray-700">
                <p class="text-gray-400 mb-4 text-lg">Total analyzed: <strong>${inventory.length}</strong> products</p>
                <button onclick="this.closest('.fixed').remove()" class="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-12 py-5 rounded-2xl font-bold text-xl transition transform hover:scale-105 shadow-2xl">
                    Got it, thanks AI! 👍
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Live search
function initSearch() {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            const rows = document.querySelectorAll("#inventoryTable tr");
            rows.forEach((row, index) => {
                const nameCell = row.cells[0]?.textContent.toLowerCase() || "";
                const qtyCell = row.cells[1]?.textContent || "";
                row.style.display = (nameCell.includes(query) || qtyCell.includes(query)) ? "" : "none";
            });
        });
    }
}

// Page load initialization
if (window.location.pathname.includes("inventory.html")) {
    window.addEventListener('load', () => {
        checkAuth();  // Smart welcome message
        loadInventory();  // Load user data
        initSearch();  // Live search
    });
}

// Custom CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slide-up {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
`;
document.head.appendChild(style);
