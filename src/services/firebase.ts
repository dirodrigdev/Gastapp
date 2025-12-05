import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// TUS CREDENCIALES REALES
const firebaseConfig = {
  apiKey: "AIzaSyDM1oC6SBU_kRrLSJq0P7P5-NUGWSRVnh0",
  authDomain: "duofin-c1894.firebaseapp.com",
  projectId: "duofin-c1894",
  storageBucket: "duofin-c1894.firebasestorage.app",
  messagingSenderId: "560986741892",
  appId: "1:560986741892:web:3d2b4aebf15872f4a536d1"
};

// Inicializamos la conexión
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);