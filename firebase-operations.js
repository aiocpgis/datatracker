import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { doc, setDoc, getDocs, collection, query, where, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

let authInstance = null;
let secondaryAuthInstance = null;
let authReadyPromise = null;

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

function normalizeUserRecord(userData = {}, docId = '') {
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
        canDeleteGeometry: userData.role === 'admin' ? true : userData.canDeleteGeometry === true
    };
}

async function queryUsersByField(field, value) {
    if (!window.db || !value) return [];
    const q = query(collection(window.db, 'users'), where(field, '==', value));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((snapshot) => normalizeUserRecord(snapshot.data(), snapshot.id));
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

        let targetEmail = null;
        const normalizedIdentifier = normalizeIdentifier(cleanedIdentifier);

        // 1. Try resolving email from Firestore (Username as ID or Username field)
        const userDocRef = doc(window.db, 'users', normalizedIdentifier);
        const userDocSnap = await getDocs(query(collection(window.db, 'users'), where('__name__', '==', normalizedIdentifier)));
        
        let foundUser = null;
        if (!userDocSnap.empty) {
            foundUser = normalizeUserRecord(userDocSnap.docs[0].data(), userDocSnap.docs[0].id);
        } else if (!normalizedIdentifier.includes('@')) {
            const fieldSearch = await queryUsersByField('username', normalizedIdentifier);
            if (fieldSearch.length > 0) foundUser = fieldSearch[0];
        }

        if (foundUser) {
            targetEmail = foundUser.email;
        } else if (normalizedIdentifier.includes('@')) {
            targetEmail = normalizedIdentifier;
        }

        if (!targetEmail) {
            return { success: false, message: 'اسم المستخدم أو البريد الإلكتروني غير مسجل.' };
        }

        // 2. Perform safe Firebase Authentication
        const userCredential = await signInWithEmailAndPassword(authInstance, targetEmail, cleanedPassword);
        
        // 3. Fetch full permissions (Role profile)
        const finalUsers = await queryUsersByField('email', targetEmail);
        if(!finalUsers.length) {
            await signOut(authInstance);
            return { success: false, message: 'تم التوثيق ولكنك لا تملك ملف صلاحيات.' };
        }
        
        const userData = finalUsers[0];
        if (userData.active === false) {
            await signOut(authInstance);
            return { success: false, message: 'هذا الحساب معطل حالياً.' };
        }

        return { success: true, user: normalizeUserRecord(userData, targetEmail) };
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
        const userSnap = await getDocs(query(collection(window.db, 'users'), where('email', '==', normalized.email)));
        const isNewUser = userSnap.empty;

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
