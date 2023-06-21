import { initializeApp } from 'firebase/app';
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase, ref } from "firebase/database"
// add firebase config here
export const firebaseConfig = {
    apiKey: "AIzaSyBUGuCnI-g2RMXdEcO5OemMoEP3ItYtpBY",
    authDomain: "mobile-status-cd92c.firebaseapp.com",
    databaseURL: "https://mobile-status-cd92c-default-rtdb.firebaseio.com",
    projectId: "mobile-status-cd92c",
    storageBucket: "mobile-status-cd92c.appspot.com",
    messagingSenderId: "94099481862",
    appId: "1:94099481862:web:3b5b4ff2d1803baa222a87",
    measurementId: "G-9S4JLDTH0S"
};

// initialize firebase app

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app)
export const storage = getStorage(app);
export default ref;
export const database = getDatabase(app)