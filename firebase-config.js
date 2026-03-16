import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDGNpOHDqzMC3ylgQxp1JN0IsUb_rLPTRY",
  authDomain: "chile-arrival-839a1.firebaseapp.com",
  projectId: "chile-arrival-839a1",
  storageBucket: "chile-arrival-839a1.firebasestorage.app",
  messagingSenderId: "chile-arrival-839a1.firebasestorage.app",
  appId: "1:1008043594423:web:a3f4e72ba07dedc6483332",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

window.getCurrentUser = () => auth.currentUser;

window.loginWithGoogle = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.error('Error login:', e);
  }
};

window.logout = async () => {
  await signOut(auth);
  document.getElementById('userPanel').classList.add('hidden');
  document.getElementById('loginBtn').classList.remove('hidden');
  document.getElementById('logoutBtn').classList.add('hidden');
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById('loginBtn').classList.add('hidden');
    document.getElementById('logoutBtn').classList.remove('hidden');
    document.getElementById('userPanel').classList.remove('hidden');
    document.getElementById('userAvatar').src = user.photoURL || '';
    document.getElementById('userNameDisplay').textContent = user.displayName || 'Usuario';
  } else {
    document.getElementById('loginBtn').classList.remove('hidden');
    document.getElementById('logoutBtn').classList.add('hidden');
    document.getElementById('userPanel').classList.add('hidden');
  }
});

