import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { firebaseConfig } from "../../firebase-config.js";
import { initializeFirebase, authenticateUser } from "../../firebase-operations.js";

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
window.db = getFirestore(app);
window.firebaseInit = initializeFirebase(app);

// عناصر الواجهة
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('errorMsg');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnLoader = document.getElementById('btnLoader');

const mainContainer = document.querySelector('main');
const fullscreenLoader = document.getElementById('fullscreenLoader');
const loaderProgress = document.getElementById('loaderProgress');
const loaderDetail = document.getElementById('loaderDetail');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = usernameInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  if (!username || !password) return;

  // إخفاء رسالة الخطأ وتشغيل اللودر
  errorMsg.classList.add('hidden');
  errorMsg.classList.remove('animate__headShake');
  btnText.classList.add('hidden');
  btnLoader.classList.remove('hidden');
  submitBtn.disabled = true;

  try {
    const result = await authenticateUser(username, password);

    if (result.success && result.user) {
      // نجاح تسجيل الدخول - Token تمت إدارته عبر Firebase Auth
      // حفظ بيانات الجلسة 
      const sessionData = { ...result.user };
      delete sessionData.password;
      sessionStorage.setItem('currentUser', JSON.stringify(sessionData));

      // بدء تأثير انتقال التحميل الفاخر
      startSuccessTransition(result.user.name);
    } else {
      showError(result.message);
    }
  } catch (error) {
    console.error("Firebase Error:", error);
    showError("حدث خطأ في الاتصال بالخادم.");
  }
});

function showError(customMsg) {
  // إعادة الزر لشكله الطبيعي
  btnText.classList.remove('hidden');
  btnLoader.classList.add('hidden');
  submitBtn.disabled = false;
  
  // إظهار رسالة الخطأ مع حركة
  if (customMsg) errorMsg.querySelector('span').textContent = customMsg;
  else errorMsg.querySelector('span').textContent = "بيانات الدخول غير صحيحة، يرجى المحاولة مرة أخرى.";

  errorMsg.classList.remove('hidden');
  // Trigger reflow to restart animation
  void errorMsg.offsetWidth; 
  errorMsg.classList.add('animate__headShake');
}

function startSuccessTransition(userName) {
  // إخفاء صندوق الدخول
  mainContainer.classList.remove('animate__fadeInUp');
  mainContainer.classList.add('animate__zoomOut');
  
  // الانتقال مباشرة للصفحة الرئيسية التي تحوي اللودر المخصص للخرائط
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 400); // 400ms لإعطاء فرصة لحركة الخروج (zoomOut)
}
