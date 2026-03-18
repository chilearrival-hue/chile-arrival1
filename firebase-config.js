import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyC2s3FmZ_aQnXNNGMoBHEfFDV7SqFbSNpA",
  authDomain: "chile-arrival-839a1.firebaseapp.com",
  projectId: "chile-arrival-839a1",
  storageBucket: "chile-arrival-839a1.appspot.com",
  messagingSenderId: "1098395537488",
  appId: "1:1098395537488:web:4e9a2d8f1b3c5e6a7b8c9d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Elementos de auth — guardados con null-check para evitar errores
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userPanel = document.getElementById('userPanel');
const userAvatar = document.getElementById('userAvatar');
const userNameDisplay = document.getElementById('userNameDisplay');

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginBtn?.classList.add('hidden');
    logoutBtn?.classList.remove('hidden');
    userPanel?.classList.remove('hidden');
    if (userAvatar) userAvatar.src = user.photoURL || '';
    if (userNameDisplay) userNameDisplay.textContent = user.displayName || 'Usuario';
  } else {
    loginBtn?.classList.remove('hidden');
    logoutBtn?.classList.add('hidden');
    userPanel?.classList.add('hidden');
  }
});
