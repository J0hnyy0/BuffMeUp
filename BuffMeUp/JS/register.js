import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, updateProfile, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDVOlw2iyAaKWiuBtqobqqJhvkMoTZ9MtQ",
  authDomain: "buffmeup-b1282.firebaseapp.com",
  projectId: "buffmeup-b1282",
  storageBucket: "buffmeup-b1282.firebasestorage.app",
  messagingSenderId: "853251681726",
  appId: "1:853251681726:web:8d04ef6d24fcdc4b9eddef",
  measurementId: "G-22696XTHQX"
};

// Initialize Firebase with Firestore
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Common message display function
function showMessage(message, isError = false) {
  const messageElement = document.getElementById("authMessage");
  if (!messageElement) return alert(message);

  messageElement.textContent = message;
  messageElement.style.color = isError ? "#ff4444" : "#4285f4";
  messageElement.style.backgroundColor = isError ? "rgba(255,68,68,0.1)" : "rgba(66,133,244,0.1)";
  messageElement.style.border = isError ? "1px solid #ff4444" : "1px solid #4285f4";
  messageElement.style.display = "block";

  setTimeout(() => {
    messageElement.style.display = "none";
  }, 8000);
}

// Verification popup functions
function showVerificationPopup(email) {
  const existingPopup = document.getElementById('verificationPopup');
  if (existingPopup) existingPopup.remove();

  const popupOverlay = document.createElement('div');
  popupOverlay.id = 'verificationPopup';
  popupOverlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.5); display: flex;
    justify-content: center; align-items: center; z-index: 10000;
    backdrop-filter: blur(2px);
  `;

  const popupContent = document.createElement('div');
  popupContent.style.cssText = `
    background: white; padding: 30px; border-radius: 12px;
    text-align: center; max-width: 400px; width: 90%;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  `;

  const spinner = document.createElement('div');
  spinner.style.cssText = `
    width: 40px; height: 40px; border: 4px solid #f3f3f3;
    border-top: 4px solid #4285f4; border-radius: 50%;
    animation: spin 1s linear infinite; margin: 0 auto 20px;
  `;

  if (!document.getElementById('spinnerStyle')) {
    const style = document.createElement('style');
    style.id = 'spinnerStyle';
    style.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }

  const title = document.createElement('h3');
  title.textContent = 'Sending Verification Email';
  title.style.cssText = `margin: 0 0 10px; color: #333; font-size: 18px;`;

  const message = document.createElement('p');
  message.textContent = `Please wait while we send a verification email to ${email}...`;
  message.style.cssText = `margin: 0; color: #666; font-size: 14px;`;

  popupContent.appendChild(spinner);
  popupContent.appendChild(title);
  popupContent.appendChild(message);
  popupOverlay.appendChild(popupContent);
  document.body.appendChild(popupOverlay);
}

function hideVerificationPopup() {
  const popup = document.getElementById('verificationPopup');
  if (popup) popup.remove();
}

// Enhanced function to store user data in Firestore
async function storeUserData(user, username, additionalData = {}) {
  try {
    const userDoc = doc(db, 'users', user.uid);
    
    // Enhanced user data structure
    const userData = {
      uid: user.uid,
      displayName: username,
      email: user.email,
      name: username,
      emailVerified: user.emailVerified,
      registrationDate: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: null,
      profilePhotoURL: user.photoURL || null,
      phoneNumber: user.phoneNumber || null,
      
      // User preferences and settings
      preferences: {
        newsletter: false,
        notifications: true,
        theme: 'light'
      },
      
      // User profile information
      profile: {
        firstName: username.split(' ')[0] || '',
        lastName: username.split(' ').slice(1).join(' ') || '',
        dateOfBirth: null,
        gender: null,
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        }
      },
      
      // Account status and metadata
      accountStatus: 'active',
      role: 'customer', // customer, admin, etc.
      totalOrders: 0,
      totalSpent: 0,
      favoriteItems: [],
      cartItems: [],
      
      // Merge any additional data passed to the function
      ...additionalData
    };

    await setDoc(userDoc, userData);
    console.log('User data stored successfully in Firestore with ID:', user.uid);
    return true;
  } catch (error) {
    console.error('Error storing user data to Firestore:', error);
    throw error; // Re-throw to handle in calling function
  }
}

// Function to update user data in Firestore
async function updateUserData(uid, updateData) {
  try {
    const userDoc = doc(db, 'users', uid);
    await updateDoc(userDoc, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    console.log('User data updated successfully in Firestore');
    return true;
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
}

// Function to get user data from Firestore
async function getUserData(uid) {
  try {
    const userDoc = doc(db, 'users', uid);
    const userSnap = await getDoc(userDoc);
    
    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      console.log('No user document found!');
      return null;
    }
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
}

// Function to update last login time
async function updateLastLogin(uid) {
  try {
    await updateUserData(uid, { 
      lastLoginAt: serverTimestamp(),
      emailVerified: true // Update this on successful login
    });
  } catch (error) {
    console.error('Error updating last login:', error);
  }
}

// Wait for DOM
window.addEventListener("DOMContentLoaded", () => {
  /* ---------------- LOGIN ---------------- */
  const loginForm = document.getElementById("login-form");
  const loginBtn = document.getElementById("login_btn");
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login_email").value.trim();
      const password = document.getElementById("login_password").value;

      if (!email || !password) return showMessage("Please fill in all fields!", true);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showMessage("Invalid email address!", true);

      loginBtn.disabled = true;
      loginBtn.textContent = "Signing In...";

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
          showMessage("Please verify your email before logging in.", true);
          await signOut(auth);
          return;
        }

        // Update last login time in Firestore
        await updateLastLogin(user.uid);

        // Get user data from Firestore for enhanced session storage
        try {
          const userData = await getUserData(user.uid);
          if (userData) {
            // Store enhanced user info in session
            sessionStorage.setItem("userFullName", userData.displayName || userData.name || "User");
            sessionStorage.setItem("loggedInUserId", user.uid);
            sessionStorage.setItem("userEmail", user.email);
            sessionStorage.setItem("userRole", userData.role || "customer");
            
            // Also update localStorage for backward compatibility
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userName', userData.displayName || userData.name || "User");
            localStorage.setItem('userEmail', user.email);
          }
        } catch (firestoreError) {
          console.error('Error fetching user data from Firestore:', firestoreError);
          // Fallback to auth data
          sessionStorage.setItem("userFullName", user.displayName || "User");
          sessionStorage.setItem("loggedInUserId", user.uid);
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userName', user.displayName || "User");
          localStorage.setItem('userEmail', user.email);
        }

        showMessage("Login successful! Redirecting...");
        setTimeout(() => (window.location.href = "Collection.html"), 1500);
      } catch (err) {
        let msg = "Login failed.";
        if (err.code === "auth/user-not-found") msg = "No account with this email.";
        else if (["auth/wrong-password", "auth/invalid-credential"].includes(err.code)) msg = "Incorrect email or password.";
        else if (err.code === "auth/too-many-requests") msg = "Too many attempts. Try later.";
        showMessage(msg, true);
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = "Login";
      }
    });
  }

  if (typeof updateAuthUI === 'function') {
        updateAuthUI();
    }

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login_email").value.trim();
      if (!email) return showMessage("Enter your email first.", true);
      try {
        await sendPasswordResetEmail(auth, email);
        showMessage("Password reset email sent!");
      } catch {
        showMessage("Failed to send password reset email.", true);
      }
    });
  }

  /* ---------------- SIGNUP ---------------- */
  const signupForm = document.getElementById("signup-form");
  const signupBtn = document.getElementById("signup_btn");

  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value.trim();
      const email = document.getElementById("signup_email").value.trim();
      const pw = document.getElementById("create_password").value;
      const confirmPw = document.getElementById("confirm_password").value;

      if (!username || !email || !pw || !confirmPw) return showMessage("Please fill all fields!", true);
      if (pw !== confirmPw) return showMessage("Passwords do not match!", true);
      if (pw.length < 6) return showMessage("Password must be 6+ characters!", true);

      signupBtn.disabled = true;
      signupBtn.textContent = "Creating...";

      try {
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, pw);
        const user = userCredential.user;

        // Update profile with display name
        await updateProfile(user, { displayName: username });
        console.log("User profile updated successfully");

        // Store comprehensive user data in Firestore
        try {
          await storeUserData(user, username);
          console.log("User data successfully stored in Firestore");
        } catch (firestoreError) {
          console.error("Failed to store user data in Firestore:", firestoreError);
          showMessage("Account created but there was an issue saving profile data.", true);
          // Continue with email verification even if Firestore fails
        }

        // Show sending verification popup
        showVerificationPopup(email);

        // Send email verification
        try {
          await sendEmailVerification(user, {
            url: `${window.location.origin}/Register.html?mode=verifyEmail`,
            handleCodeInApp: false
          });
          
          console.log("Verification email sent successfully to:", email);
          hideVerificationPopup();
          showMessage(`Account created successfully! Please check ${email} for verification link before logging in.`);
          
          // Sign out the user so they must verify email before logging in
          await signOut(auth);
          
          // Reset form and switch to login
          signupForm.reset();
          
          // Switch to login form
          const loginContainer = document.getElementById("loginForm");
          const signupContainer = document.getElementById("signupForm");
          const loginToggle = document.getElementById("loginToggle");
          const signupToggle = document.getElementById("signupToggle");
          
          if (loginContainer && signupContainer) {
            loginContainer.style.display = "block";
            signupContainer.style.display = "none";
            loginToggle?.classList.add("active");
            signupToggle?.classList.remove("active");
          }
          
        } catch (verificationError) {
          console.error("Email verification failed:", verificationError);
          hideVerificationPopup();
          showMessage("Account created but verification email failed. Please try logging in and we'll resend it.", true);
        }

      } catch (err) {
        console.error("Signup error:", err);
        let msg = "Signup failed.";
        if (err.code === "auth/email-already-in-use") {
          msg = "Email already registered. Try logging in instead.";
        } else if (err.code === "auth/weak-password") {
          msg = "Password too weak. Use at least 6 characters.";
        } else if (err.code === "auth/invalid-email") {
          msg = "Invalid email address format.";
        } else if (err.code === "auth/network-request-failed") {
          msg = "Network error. Check your connection.";
        }
        showMessage(msg, true);
      } finally {
        signupBtn.disabled = false;
        signupBtn.textContent = "Create Account";
      }
    });
  }

  /* ---------------- PASSWORD TOGGLE ---------------- */
  document.querySelectorAll(".password-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.previousElementSibling;
      input.type = input.type === "password" ? "text" : "password";
    });
  });

  /* ---------------- TOGGLE LOGIN/SIGNUP ---------------- */
  const loginToggle = document.getElementById("loginToggle");
  const signupToggle = document.getElementById("signupToggle");
  const loginContainer = document.getElementById("loginForm");
  const signupContainer = document.getElementById("signupForm");

  if (loginToggle && signupToggle) {
    loginToggle.addEventListener("click", () => {
      loginContainer.style.display = "block";
      signupContainer.style.display = "none";
      loginToggle.classList.add("active");
      signupToggle.classList.remove("active");
    });
    signupToggle.addEventListener("click", () => {
      loginContainer.style.display = "none";
      signupContainer.style.display = "block";
      signupToggle.classList.add("active");
      loginToggle.classList.remove("active");
    });
  }

  /* ---------------- Handle Email Verification on Page Load ---------------- */
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('mode') === 'verifyEmail') {
    showMessage("Email verified successfully! You can now log in.");
  }
});

// Export functions for use in other modules if needed
window.storeUserData = storeUserData;
window.updateUserData = updateUserData;
window.getUserData = getUserData;
window.updateLastLogin = updateLastLogin;