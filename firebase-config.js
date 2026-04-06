import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js';

const firebaseConfig = {
  apiKey: "AIzaSyC2s3FmZ_aQnXNNGMoBHEfFDV7SqFbSNpA",
  authDomain: "chile-arrival-839a1.firebaseapp.com",
  projectId: "chile-arrival-839a1",
  storageBucket: "chile-arrival-839a1.appspot.com",
  messagingSenderId: "1098395537488",
  appId: "1:1008043594423:web:a3f4e72ba07dedc6483332"  // ← el que copiaste en el fix anterior
};

const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const provider = new GoogleAuthProvider();
const messaging = getMessaging(app);

const VAPID_KEY = 'BFeYKBc77bJivWY0qzH4xm8DBJx0dIzXhzVa-nAX3fVm-x1oT_tkvt-NA2nsiMRS7j-8XjAv6kAclflgkQapitA';

// ===== FCM: SOLICITAR PERMISO Y OBTENER TOKEN =====
window.requestPushPermission = async function() {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      if (typeof showToast === 'function') {
        const lang = localStorage.getItem('language') || 'es';
        showToast(lang === 'es' ? '🔕 Notificaciones desactivadas' : '🔕 Notifications disabled', 3000);
      }
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration()
    });

    if (token) {
      localStorage.setItem('fcmToken', token);
      const lang = localStorage.getItem('language') || 'es';
      if (typeof showToast === 'function') {
        showToast(lang === 'es' ? '🔔 ¡Notificaciones activadas!' : '🔔 Notifications enabled!', 3000);
      }
      logger && logger.log('FCM token:', token);
      return token;
    }
  } catch (error) {
    logger && logger.error('Error FCM:', error);
    return null;
  }
};

// ===== FCM: NOTIFICACIONES EN FOREGROUND =====
onMessage(messaging, (payload) => {
  const { title, body } = payload.notification || {};
  if (title && typeof showToast === 'function') {
    showToast(`🔔 ${title}: ${body}`, 5000);
  }
});

// ===== ESTADO DEL USUARIO =====
onAuthStateChanged(auth, (user) => {
  const loginBtn    = document.getElementById('loginBtn');
  const userPanel   = document.getElementById('userPanel');
  const userAvatar  = document.getElementById('userAvatar');
  const userNameDisplay = document.getElementById('userNameDisplay');

  if (user) {
    loginBtn?.classList.add('hidden');
    userPanel?.classList.remove('hidden');
    if (userAvatar)      userAvatar.src = user.photoURL || '';
    if (userNameDisplay) userNameDisplay.textContent = user.displayName || 'Usuario';

    // Sugerencia de login completada — guardar en localStorage
    localStorage.setItem('userLoggedIn', 'true');
    localStorage.setItem('userName', user.displayName || '');
  } else {
    loginBtn?.classList.remove('hidden');
    userPanel?.classList.add('hidden');
    localStorage.removeItem('userLoggedIn');

    // Mostrar sugerencia de login si no la ha visto
    const seen = localStorage.getItem('loginSuggestionSeen');
    if (!seen) {
      setTimeout(() => suggestLogin(), 4000);
    }
  }
});

// ===== LOGIN =====
window.handleLogin = async function() {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error('Error login:', error);
    const lang = localStorage.getItem('language') || 'es';
    const msg  = lang === 'es' ? '❌ Error al iniciar sesión' : '❌ Login error';
    // Reusar showToast si está disponible
    if (typeof showToast === 'function') showToast(msg, 3000);
  }
};

// ===== LOGOUT =====
window.handleLogout = async function() {
  try {
    await signOut(auth);
    document.getElementById('userMenu')?.classList.add('hidden');
    const lang = localStorage.getItem('language') || 'es';
    if (typeof showToast === 'function') {
      showToast(lang === 'es' ? '👋 Sesión cerrada' : '👋 Logged out', 2000);
    }
  } catch (error) {
    console.error('Error logout:', error);
  }
};

// ===== SUGERENCIA DE LOGIN =====
function suggestLogin() {
  localStorage.setItem('loginSuggestionSeen', 'true');
  const lang = localStorage.getItem('language') || 'es';

  const overlay = document.createElement('div');
  overlay.id = 'loginSuggestion';
  overlay.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);z-index:9999;width:90%;max-width:360px';

  overlay.innerHTML = `
    <div style="background:linear-gradient(135deg,#0039a6,#1e40af);border-radius:20px;padding:20px;box-shadow:0 10px 40px rgba(0,57,166,0.4);color:white">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <div style="background:rgba(255,255,255,0.2);border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <i class="fas fa-user" style="font-size:20px"></i>
        </div>
        <div>
          <p style="font-weight:900;font-size:15px;margin-bottom:2px">
            ${lang === 'es' ? '¡Guarda tu progreso! 🇨🇱' : 'Save your progress! 🇨🇱'}
          </p>
          <p style="font-size:12px;opacity:0.85;font-weight:600">
            ${lang === 'es'
              ? 'Inicia sesión para no perder tu checklist y fecha de ingreso'
              : 'Sign in to keep your checklist and entry date'}
          </p>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button onclick="handleLogin();document.getElementById('loginSuggestion')?.remove()"
          style="flex:1;background:white;color:#0039a6;border:none;border-radius:12px;padding:10px;font-weight:900;font-size:13px;cursor:pointer">
          <i class="fab fa-google" style="margin-right:6px"></i>
          ${lang === 'es' ? 'Entrar con Google' : 'Sign in with Google'}
        </button>
        <button onclick="document.getElementById('loginSuggestion')?.remove()"
          style="background:rgba(255,255,255,0.2);color:white;border:none;border-radius:12px;padding:10px 14px;font-weight:800;font-size:13px;cursor:pointer">
          ${lang === 'es' ? 'Ahora no' : 'Not now'}
        </button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  // Se cierra automáticamente después de 8 segundos
  setTimeout(() => overlay?.remove(), 8000);
}