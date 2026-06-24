/* C:\Users\Reyhan\Documents\spk\auth.js */

// Helper to notify page redirects or events
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) {
        const toastDiv = document.createElement('div');
        toastDiv.id = 'toast-container';
        toastDiv.className = 'toast-container';
        document.body.appendChild(toastDiv);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-message">${message}</span>
    `;
    document.getElementById('toast-container').appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// Check auth state and redirect if needed
// requireAuth: if true, redirects to login if not logged in. If false, redirects to dashboard if logged in.
function checkPageAuth(requireAuth = true) {
    auth_onStateChanged((user) => {
        const currentPage = window.location.pathname.split('/').pop();
        if (requireAuth && !user) {
            window.location.href = 'login.php';
        } else if (!requireAuth && user) {
            window.location.href = 'dashboard.php';
        }
    });
}

function auth_onStateChanged(callback) {
    if (window.useFirebase) {
        window.auth.onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                // Get additional profile details from firestore
                try {
                    const userDoc = await window.db.collection('users').doc(firebaseUser.uid).get();
                    if (userDoc.exists) {
                        const profile = userDoc.data();
                        callback({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            ...profile
                        });
                    } else {
                        callback({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            name: firebaseUser.displayName || 'User',
                            username: firebaseUser.email.split('@')[0],
                            profession: 'Mahasiswa'
                        });
                    }
                } catch (e) {
                    callback({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        name: firebaseUser.displayName || 'User'
                    });
                }
            } else {
                callback(null);
            }
        });
    } else {
        // Local storage fallback listener
        const checkUser = () => {
            const userStr = sessionStorage.getItem('spk_current_user') || localStorage.getItem('spk_current_user');
            if (userStr) {
                callback(JSON.parse(userStr));
            } else {
                callback(null);
            }
        };
        // Run immediately
        checkUser();
        // Also listen to storage events (tab sync)
        window.addEventListener('storage', checkUser);
    }
}

async function auth_signUp(email, password, name, username, profession) {
    if (window.useFirebase) {
        try {
            const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;
            const profile = {
                name: name,
                username: username,
                profession: profession,
                photoUrl: ''
            };
            await window.db.collection('users').doc(uid).set(profile);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    } else {
        // Localstorage mock registration
        let users = JSON.parse(localStorage.getItem('spk_users') || '[]');
        if (users.find(u => u.email === email || u.username === username)) {
            return { success: false, error: "Email atau Username sudah terdaftar!" };
        }
        
        const newUser = {
            uid: 'local_' + Date.now(),
            email: email,
            password: password, // In mock, plaintext is ok for simulation
            name: name,
            username: username,
            profession: profession,
            photoUrl: 'assets/default-avatar.png'
        };
        
        users.push(newUser);
        localStorage.setItem('spk_users', JSON.stringify(users));
        return { success: true };
    }
}

async function auth_signIn(email, password) {
    if (window.useFirebase) {
        try {
            await window.auth.signInWithEmailAndPassword(email, password);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    } else {
        // Localstorage mock login
        const users = JSON.parse(localStorage.getItem('spk_users') || '[]');
        const user = users.find(u => (u.email === email || u.username === email) && u.password === password);
        if (user) {
            sessionStorage.setItem('spk_current_user', JSON.stringify(user));
            return { success: true };
        } else {
            return { success: false, error: "Email/Username atau password salah!" };
        }
    }
}

async function auth_signOut() {
    if (window.useFirebase) {
        await window.auth.signOut();
    } else {
        sessionStorage.removeItem('spk_current_user');
        localStorage.removeItem('spk_current_user');
        window.location.href = 'login.php';
    }
}

async function auth_updateProfile(uid, name, username, password, profession, photoBase64 = null) {
    if (window.useFirebase) {
        try {
            const updates = { name, username, profession };
            
            // Handle password update if provided
            if (password && password.trim() !== '') {
                const user = window.auth.currentUser;
                await user.updatePassword(password);
            }
            
            // Handle photo upload
            if (photoBase64) {
                // If it is base64, we can store it directly in Firestore as a string (small file sizes)
                // or put it in Firebase Storage. For simplicity & speed, store in Firestore if small,
                // or mock it.
                updates.photoUrl = photoBase64;
            }
            
            await window.db.collection('users').doc(uid).set(updates, { merge: true });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    } else {
        // Localstorage mock update
        try {
            let users = JSON.parse(localStorage.getItem('spk_users') || '[]');
            let userIdx = users.findIndex(u => u.uid === uid);
            
            if (userIdx !== -1) {
                users[userIdx].name = name;
                users[userIdx].username = username;
                users[userIdx].profession = profession;
                if (password && password.trim() !== '') {
                    users[userIdx].password = password;
                }
                if (photoBase64) {
                    users[userIdx].photoUrl = photoBase64;
                }
                
                localStorage.setItem('spk_users', JSON.stringify(users));
                sessionStorage.setItem('spk_current_user', JSON.stringify(users[userIdx]));
                return { success: true };
            }
            return { success: false, error: "User tidak ditemukan." };
        } catch (error) {
            return { success: false, error: "Gagal menyimpan ke penyimpanan lokal (Mungkin ukuran foto terlalu besar atau kuota penuh)." };
        }
    }
}
