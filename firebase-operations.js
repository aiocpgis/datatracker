import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { doc, setDoc, getDoc, getDocs, collection, query, where, deleteDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

let authInstance = null;
let secondaryAuthInstance = null;
let authReadyPromise = null;

const ZONE_STATUS_STORAGE_KEY = 'zone_statuses_cache_v1';
const DEFAULT_ZONE_STATUSES = [
    { label: 'مناطق حصر جديدة', color: '#3b82f6', order: 1, active: true },
    { label: 'قيد الحصر', color: '#eab308', order: 2, active: true },
    { label: 'تم الانتهاء', color: '#22c55e', order: 3, active: true }
];

function normalizeZoneStatusItem(item = {}, index = 0) {
    return {
        label: String(item.label || '').trim(),
        color: item.color || '#64748b',
        order: Number.isFinite(item.order) ? item.order : index + 1,
        active: item.active !== false
    };
}

function readCachedZoneStatuses() {
    try {
        const raw = localStorage.getItem(ZONE_STATUS_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || !parsed.length) return null;
        return parsed.map(normalizeZoneStatusItem).filter(item => item.label);
    } catch (error) {
        console.warn('Unable to read cached zone statuses:', error);
        return null;
    }
}

function writeCachedZoneStatuses(items) {
    try {
        localStorage.setItem(ZONE_STATUS_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
        console.warn('Unable to cache zone statuses:', error);
    }
}

// Initialize a secondary app for administrative actions (like creating users)
// This prevents the main auth session from being disrupted.
let secondaryApp = null;
try {
    secondaryApp = initializeApp(firebaseConfig, "authAdminApp");
    secondaryAuthInstance = getAuth(secondaryApp);
} catch (e) {
    console.warn("Secondary Auth App initialization issue:", e);
}

function normalizeGovernorateValue(value) {
    if (Array.isArray(value)) {
        return value.map((item) => String(item || '').trim()).filter(Boolean);
    }

    const raw = String(value || '').trim();
    if (!raw || raw.toLowerCase() === 'all') return 'all';

    const items = raw.split(/[,،]/).map((item) => item.trim()).filter(Boolean);
    if (!items.length) return 'all';
    return items.length === 1 ? items[0] : items;
}

function normalizeIdentifier(value) {
    return String(value || '').trim().toLowerCase();
}

export function normalizeUserRecord(userData = {}, docId = '') {
    const email = (userData.email || docId || '').trim().toLowerCase();
    const username = (userData.username || (email.includes('@') ? email.split('@')[0] : email) || '').trim();

    return {
        ...userData,
        id: userData.id || docId || email || username,
        name: userData.name || userData.fullName || username || email || 'مستخدم',
        fullName: userData.fullName || userData.name || username || email || 'مستخدم',
        email,
        username,
        role: userData.role || 'viewer',
        governorate: normalizeGovernorateValue(userData.governorate || userData.governorates || 'all'),
        active: userData.active !== false,
        showHome: userData.showHome !== false,
        showStats: userData.showStats !== false,
        showFlow: userData.showFlow !== false,
        showStyle: userData.showStyle !== false,
        showPersonas: userData.showPersonas !== false,
        canDraw: userData.role === 'admin' ? true : userData.canDraw === true,
        canEditData: userData.role === 'admin' ? true : userData.canEditData === true,
        canEditStatus: userData.role === 'admin' ? true : userData.canEditStatus === true,
        canExport: userData.role === 'admin' ? true : userData.canExport === true,
        canManageUsers: userData.role === 'admin' ? true : userData.canManageUsers === true,
        canEditGeometry: userData.role === 'admin' ? true : userData.canEditGeometry === true,
        canEditGeometry: userData.role === 'admin' ? true : userData.canEditGeometry === true,
        canDeleteGeometry: userData.role === 'admin' ? true : userData.canDeleteGeometry === true,
        view_statu: userData.view_statu !== false,
        view_engineers: userData.view_engineers !== false,
        view_teams: userData.view_teams !== false,
        view_units: userData.view_units === true, // False by default for non-admins
        gender: userData.gender || 'male'
    };
}

async function queryUsersByField(field, value) {
    if (!window.db || !value) return [];
    const q = query(collection(window.db, 'users'), where(field, '==', value));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((snapshot) => normalizeUserRecord(snapshot.data(), snapshot.id));
}

function normalizeUsernameValue(value) {
    return String(value || '').trim().toLowerCase();
}

async function saveLoginIndexEntry(userData) {
    const normalized = normalizeUserRecord(userData, userData.email || userData.username);
    const username = normalizeUsernameValue(normalized.username);
    if (!username || !normalized.email) return;

    await setDoc(doc(window.db, 'login_index', username), {
        email: normalized.email,
        username,
        active: normalized.active !== false,
        updatedAt: new Date().toISOString()
    }, { merge: true });
}

async function deleteLoginIndexEntryByUsername(username) {
    const normalized = normalizeUsernameValue(username);
    if (!normalized) return;
    await deleteDoc(doc(window.db, 'login_index', normalized));
}

async function deleteLoginIndexEntryByEmail(email) {
    const normalizedEmail = normalizeIdentifier(email);
    if (!normalizedEmail) return;
    const users = await queryUsersByField('email', normalizedEmail);
    if (users.length) {
        const username = normalizeUsernameValue(users[0].username);
        if (username) {
            await deleteLoginIndexEntryByUsername(username);
        }
    }
}

async function resolveEmailFromLoginIdentifier(identifier) {
    const normalizedIdentifier = normalizeIdentifier(identifier);
    if (!normalizedIdentifier) return null;

    if (normalizedIdentifier.includes('@')) {
        return normalizedIdentifier;
    }

    try {
        const loginIndexSnap = await getDoc(doc(window.db, 'login_index', normalizedIdentifier));
        if (loginIndexSnap.exists()) {
            const data = loginIndexSnap.data() || {};
            if (data.active === false) return null;
            return normalizeIdentifier(data.email || '');
        }
    } catch (error) {
        console.warn('Unable to resolve username from login_index:', error);
    }

    return null;
}

function findLocalUser(identifier) {
    const normalizedIdentifier = normalizeIdentifier(identifier);
    const match = localUsers.find((user) => {
        const normalizedEmail = normalizeIdentifier(user.email);
        const normalizedUsername = normalizeIdentifier(user.username);
        return normalizedIdentifier === normalizedEmail || normalizedIdentifier === normalizedUsername;
    });
    return match ? normalizeUserRecord(match, match.email || match.username) : null;
}

export async function initializeFirebase(app) {
    if (authReadyPromise) return authReadyPromise;

    authReadyPromise = (async () => {
        authInstance = getAuth(app);
        if (authInstance.currentUser) {
            console.log('Firebase user found:', authInstance.currentUser.uid);
        } else {
            console.log('No Firebase user signed in - Firestore will use current permissions.');
        }

        onAuthStateChanged(authInstance, (user) => {
            if (user) {
                console.log('Firebase auth state changed: signed in', user.uid);
            } else {
                console.log('Firebase auth state changed: signed out');
            }
        });

        return authInstance;
    })();

    return authReadyPromise;
}

export async function authenticateUser(identifier, password) {
    const cleanedIdentifier = String(identifier || '').trim();
    const cleanedPassword = String(password || '');

    if (!cleanedIdentifier || !cleanedPassword) {
        return { success: false, message: 'يرجى إدخال البريد الإلكتروني أو اسم المستخدم وكلمة المرور' };
    }

    try {
        if (window.firebaseInit) await window.firebaseInit;

        const targetEmail = await resolveEmailFromLoginIdentifier(cleanedIdentifier);
        if (!targetEmail) {
            return { success: false, message: 'اسم المستخدم أو البريد الإلكتروني غير مسجل.' };
        }

        const userCredential = await signInWithEmailAndPassword(authInstance, targetEmail, cleanedPassword);

        const userRef = doc(window.db, 'users', targetEmail);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            await signOut(authInstance);
            return { success: false, message: 'تم التوثيق ولكن لا يوجد ملف صلاحيات لهذا المستخدم.' };
        }

        const userData = normalizeUserRecord(userSnap.data(), userSnap.id);
        if (userData.active === false) {
            await signOut(authInstance);
            return { success: false, message: 'هذا الحساب معطل حالياً.' };
        }

        return { success: true, user: userData };
    } catch (error) {
        console.error('Firebase Auth error:', error.code, error.message);
        let message = 'تعذر التحقق من البيانات.';
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
             message = 'البيانات غير صحيحة، يرجى المحاولة مرة أخرى.';
        } else if (error.code === 'auth/too-many-requests') {
             message = 'محاولات كثيرة خاطئة، تم حظر الحساب مؤقتاً.';
        }
        return { success: false, message };
    }
}

export async function signOutUser() {
    try {
        if (window.firebaseInit) await window.firebaseInit;
        await signOut(authInstance);
        return { success: true };
    } catch (e) {
        return { success: false, message: e.message };
    }
}

export async function saveZoneUpdate(zoneCode, data) {
    try {
        if (window.firebaseInit) await window.firebaseInit;

        const docRef = doc(window.db, 'zone_updates', String(zoneCode));
        await setDoc(docRef, {
            ...data,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        console.log(`Zone ${zoneCode} updated successfully`);
        return { success: true };
    } catch (error) {
        console.error('Error saving zone update:', error);
        return { success: false, message: error.message };
    }
}

export async function loadAllZoneUpdates() {
    try {
        if (window.firebaseInit) await window.firebaseInit;

        const querySnapshot = await getDocs(collection(window.db, 'zone_updates'));
        const updates = {};
        querySnapshot.forEach((snapshot) => {
            updates[snapshot.id] = snapshot.data();
        });

        return updates;
    } catch (error) {
        console.error('Error loading zone updates:', error);
        return {};
    }
}

export async function getAllUsers() {
    try {
        if (window.firebaseInit) await window.firebaseInit;
        if (!window.db) throw new Error('Firestore not initialized');

        const querySnapshot = await getDocs(collection(window.db, 'users'));
        const users = [];
        querySnapshot.forEach((snapshot) => {
            users.push(normalizeUserRecord(snapshot.data(), snapshot.id));
        });

        return users.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    } catch (error) {
        console.error('Error loading users:', error);
        // Fallback safe handling for localUsers
        const fallback = window.localUsers || [];
        return fallback.map((user) => normalizeUserRecord(user, user.email || user.username));
    }
}

export async function saveUserToFirestore(userData) {
    try {
        if (window.firebaseInit) await window.firebaseInit;

        const normalized = normalizeUserRecord(userData, userData.email);
        if (!normalized.email) {
            return { success: false, message: 'البريد الإلكتروني مطلوب لحفظ المستخدم' };
        }

        // 1. التحقق مما إذا كان المستخدم موجوداً مسبقاً في Firestore
        const userRef = doc(window.db, 'users', normalized.email);
        const existingUserDoc = await getDoc(userRef);
        const isNewUser = !existingUserDoc.exists();
        const previousUserData = existingUserDoc.exists() ? normalizeUserRecord(existingUserDoc.data(), existingUserDoc.id) : null;

        // 2. إذا كان مستخدماً جديداً، نقوم بإنشاء حساب في Firebase Auth (إذا توفرت كلمة المرور)
        if (isNewUser && userData.password) {
            if (secondaryAuthInstance) {
                try {
                    console.log(`Attempting to create Auth account for ${normalized.email}...`);
                    await createUserWithEmailAndPassword(secondaryAuthInstance, normalized.email, userData.password);
                    // تسجيل الخروج فوراً من النسخة الثانوية لضمان النظافة
                    await signOut(secondaryAuthInstance);
                    console.log(`Auth account created successfully for ${normalized.email}`);
                } catch (authError) {
                    console.error('Auth account creation failed:', authError.code, authError.message);
                    if (authError.code === 'auth/email-already-in-use') {
                        console.warn('Auth account already exists, proceeding to save Firestore metadata.');
                    } else {
                        return { success: false, message: `فشل إنشاء حساب الدخول: ${authError.message}` };
                    }
                }
            } else {
                console.error('Secondary Auth instance not available.');
            }
        }

        // 3. الأمان: إخفاء حقل كلمة المرور من بيانات Firestore (كلمات المرور يجب أن تكون في Auth حصراً)
        let payload = { ...normalized };
        delete payload.password;

        payload.updatedAt = new Date().toISOString();
        await setDoc(userRef, payload, { merge: true });

        const previousUsername = normalizeUsernameValue(previousUserData?.username);
        const currentUsername = normalizeUsernameValue(payload.username);
        if (previousUsername && previousUsername !== currentUsername) {
            await deleteLoginIndexEntryByUsername(previousUsername).catch((error) => console.warn('Previous login index cleanup warning:', error));
        }

        await saveLoginIndexEntry(payload);

        console.log(`User ${payload.email} profile saved successfully`);
        return { success: true };
    } catch (error) {
        console.error('Error saving user profile:', error);
        return { success: false, message: error.message };
    }
}

export async function deleteUserFromFirestore(email) {
    try {
        if (window.firebaseInit) await window.firebaseInit;
        if (!email) return { success: false, message: 'البريد الإلكتروني مطلوب للحذف' };
        
        const normalizedEmail = email.toLowerCase().trim();
        await deleteLoginIndexEntryByEmail(normalizedEmail).catch((error) => console.warn('Login index cleanup warning:', error));
        
        // 1. البحث عن المستند باستخدام حقل البريد الإلكتروني (أكثر دقة)
        const q = query(collection(window.db, 'users'), where('email', '==', normalizedEmail));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            // محاولة الحذف المباشر باستخدام البريد كمعرف للمستند (fallback)
            const userRef = doc(window.db, 'users', normalizedEmail);
            await deleteDoc(userRef);
            return { success: true };
        }

        // 2. حذف المستندات التي تم العثور عليها
        const deletePromises = querySnapshot.docs.map(docSnap => deleteDoc(doc(window.db, 'users', docSnap.id)));
        await Promise.all(deletePromises);
        
        console.log(`User(s) with email ${normalizedEmail} deleted from Firestore`);
        return { success: true };
    } catch (error) {
        console.error('Error deleting user:', error);
        return { success: false, message: error.message };
    }
}

export async function syncLoginIndex() {
    try {
        if (window.firebaseInit) await window.firebaseInit;
        const users = await getAllUsers();
        for (const user of users) {
            await saveLoginIndexEntry(user);
        }
        return { success: true, count: users.length };
    } catch (error) {
        console.error('Error syncing login index:', error);
        return { success: false, message: error.message };
    }
}

export async function saveZoneDataToFirebase(data) {
    return { success: false, message: 'Legacy method disabled' };
}

export async function loadZoneDataFromFirebase() {
    return null;
}

/**
 * Custom Drawn Features Persistence
 * Collection: drawn_features
 */

export async function saveDrawnFeature(feature) {
    try {
        if (window.firebaseInit) await window.firebaseInit;
        if (!feature || !feature.id) throw new Error('Feature must have an ID');

        const docRef = doc(window.db, 'drawn_features', String(feature.id));
        await setDoc(docRef, {
            ...feature,
            updatedAt: new Date().toISOString(),
            updatedBy: window.currentUser ? window.currentUser.email : 'system'
        }, { merge: true });

        console.log(`Feature ${feature.id} saved to cloud`);
        return { success: true };
    } catch (error) {
        console.error('Error saving drawn feature:', error);
        return { success: false, message: error.message };
    }
}

export async function loadDrawnFeatures() {
    try {
        if (window.firebaseInit) await window.firebaseInit;
        const querySnapshot = await getDocs(collection(window.db, 'drawn_features'));
        const features = [];
        querySnapshot.forEach((doc) => {
            features.push({ ...doc.data(), id: doc.id });
        });
        return features;
    } catch (error) {
        console.error('Error loading drawn features:', error);
        return [];
    }
}

export async function deleteDrawnFeature(featureId) {
    try {
        if (window.firebaseInit) await window.firebaseInit;
        const docRef = doc(window.db, 'drawn_features', String(featureId));
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        console.error('Error deleting drawn feature:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Master GeoJSON Overrides
 * Collection: master_data
 */
export async function saveMasterGeoJson(key, data) {
    try {
        if (window.firebaseInit) await window.firebaseInit;
        const docRef = doc(window.db, 'master_data', key);
        await setDoc(docRef, {
            data: data,
            updatedAt: new Date().toISOString(),
            updatedBy: window.currentUser ? window.currentUser.email : 'system'
        });
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

export async function loadMasterGeoJson(key) {
    try {
        if (window.firebaseInit) await window.firebaseInit;
        const docRef = doc(window.db, 'master_data', key);
        const snapshot = await getDocs(query(collection(window.db, 'master_data'), where('__name__', '==', key)));
        if (!snapshot.empty) {
            return snapshot.docs[0].data().data;
        }
        return null;
    } catch (error) {
        return null;
    }
}

export async function loadZoneStatuses() {
    try {
        if (window.firebaseInit) await window.firebaseInit;

        const ref = doc(window.db, 'app_config', 'zone_statuses');
        const snap = await getDoc(ref);

        if (snap.exists()) {
            const items = Array.isArray(snap.data().items) ? snap.data().items.map(normalizeZoneStatusItem).filter(item => item.label) : [];
            if (items.length) {
                writeCachedZoneStatuses(items);
                return items;
            }
        }

        const cached = readCachedZoneStatuses();
        if (cached && cached.length) {
            return cached;
        }

        await setDoc(ref, {
            items: DEFAULT_ZONE_STATUSES,
            updatedAt: new Date().toISOString(),
            updatedBy: window.currentUser?.email || 'system'
        }, { merge: true });

        writeCachedZoneStatuses(DEFAULT_ZONE_STATUSES);
        return DEFAULT_ZONE_STATUSES;
    } catch (error) {
        console.error('Error loading zone statuses:', error);
        const cached = readCachedZoneStatuses();
        if (cached && cached.length) return cached;
        return DEFAULT_ZONE_STATUSES;
    }
}

export async function saveZoneStatuses(items) {
    try {
        if (window.firebaseInit) await window.firebaseInit;

        const cleaned = (items || [])
            .map((item, index) => normalizeZoneStatusItem(item, index))
            .filter(item => item.label);

        writeCachedZoneStatuses(cleaned);

        await setDoc(doc(window.db, 'app_config', 'zone_statuses'), {
            items: cleaned,
            updatedAt: new Date().toISOString(),
            updatedBy: window.currentUser?.email || 'system'
        }, { merge: true });

        return { success: true, items: cleaned, localOnly: false };
    } catch (error) {
        console.error('Error saving zone statuses:', error);
        const cleaned = (items || [])
            .map((item, index) => normalizeZoneStatusItem(item, index))
            .filter(item => item.label);
        writeCachedZoneStatuses(cleaned);
        return { success: true, items: cleaned, localOnly: true, message: error.message };
    }
}

export function listenToZoneStatuses(callback) {
    try {
        return onSnapshot(
            doc(window.db, 'app_config', 'zone_statuses'),
            (snap) => {
                let items = DEFAULT_ZONE_STATUSES;
                if (snap.exists()) {
                    const loaded = Array.isArray(snap.data().items) ? snap.data().items.map(normalizeZoneStatusItem).filter(item => item.label) : [];
                    if (loaded.length) items = loaded;
                }
                writeCachedZoneStatuses(items);
                callback(items);
            },
            (error) => {
                console.error('Zone statuses listener error:', error);
                const cached = readCachedZoneStatuses();
                callback((cached && cached.length) ? cached : DEFAULT_ZONE_STATUSES);
            }
        );
    } catch (error) {
        console.error('Unable to bind zone status listener:', error);
        const cached = readCachedZoneStatuses();
        callback((cached && cached.length) ? cached : DEFAULT_ZONE_STATUSES);
        return () => {};
    }
}
