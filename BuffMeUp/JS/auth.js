
// Function to check if user is logged in and update UI
function updateAuthUI() {
    const loggedInUserId = sessionStorage.getItem("loggedInUserId");
    const userFullName = sessionStorage.getItem("userFullName");
    
    const authButtons = document.getElementById("authButtons");
    const profileMenu = document.getElementById("profileMenu");
    const profileName = document.getElementById("profileName");
    const profileAvatar = document.getElementById("profileAvatar");

    if (loggedInUserId && userFullName) {
        // User is logged in - show profile menu, hide auth buttons
        if (authButtons) authButtons.style.display = "none";
        if (profileMenu) profileMenu.style.display = "flex";
        
        // Update profile info
        if (profileName) profileName.textContent = userFullName;
        if (profileAvatar) {
            // Use first letter of name as avatar
            profileAvatar.textContent = userFullName.charAt(0).toUpperCase();
        }
    } else {
        // User is not logged in - show auth buttons, hide profile menu
        if (authButtons) authButtons.style.display = "flex";
        if (profileMenu) profileMenu.style.display = "none";
    }
}

// Function to handle logout
function confirmLogout() {
    // Clear session storage
    sessionStorage.removeItem("loggedInUserId");
    sessionStorage.removeItem("userFullName");
    
    // Update UI
    updateAuthUI();
    
    // Close logout popup
    closeLogoutPopup();
    
    // Redirect to homepage or show success message
    showMessage("Logged out successfully!");
    
    // Optional: redirect to homepage after a short delay
    setTimeout(() => {
        window.location.href = "Homepage.html";
    }, 1500);
}

// Profile dropdown toggle
function toggleProfileDropdown() {
    const dropdown = document.getElementById("profileDropdown");
    if (dropdown) {
        dropdown.classList.toggle("show");
    }
}

// Close profile dropdown when clicking outside
document.addEventListener("click", function(event) {
    const profileMenu = document.getElementById("profileMenu");
    const dropdown = document.getElementById("profileDropdown");
    
    if (profileMenu && dropdown && !profileMenu.contains(event.target)) {
        dropdown.classList.remove("show");
    }
});

// Logout popup functions
function showLogoutPopup() {
    const popup = document.getElementById("logoutPopup");
    if (popup) {
        popup.style.display = "flex";
    }
}

function closeLogoutPopup() {
    const popup = document.getElementById("logoutPopup");
    if (popup) {
        popup.style.display = "none";
    }
}

// Message display function (if not already defined)
function showMessage(message, isError = false) {
    // Try to find existing message element
    let messageElement = document.getElementById("authMessage");
    
    // If not found, create a temporary one
    if (!messageElement) {
        messageElement = document.createElement("div");
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        document.body.appendChild(messageElement);
    }
    
    messageElement.textContent = message;
    messageElement.style.color = isError ? "#ff4444" : "#4285f4";
    messageElement.style.backgroundColor = isError ? "rgba(255,68,68,0.1)" : "rgba(66,133,244,0.1)";
    messageElement.style.border = isError ? "1px solid #ff4444" : "1px solid #4285f4";
    messageElement.style.display = "block";

    setTimeout(() => {
        messageElement.style.display = "none";
        // Remove temporary message element
        if (!document.getElementById("authMessage")) {
            messageElement.remove();
        }
    }, 3000);
}

// Initialize auth UI when page loads
document.addEventListener("DOMContentLoaded", function() {
    updateAuthUI();
    
    // Also update the "Create Account" button text on homepage if user is logged in
    const createAccountBtn = document.getElementById("createAccountBtn");
    const loggedInUserId = sessionStorage.getItem("loggedInUserId");
    
    if (createAccountBtn && loggedInUserId) {
        createAccountBtn.textContent = "View Profile";
        createAccountBtn.href = "Profile.html";
    }
});

// Export functions for use in other files
window.updateAuthUI = updateAuthUI;
window.confirmLogout = confirmLogout;
window.toggleProfileDropdown = toggleProfileDropdown;
window.showLogoutPopup = showLogoutPopup;
window.closeLogoutPopup = closeLogoutPopup;
window.showMessage = showMessage;