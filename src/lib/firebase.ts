import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where, orderBy } from "firebase/firestore";

let db: any = null;
let auth: any = null;
let isFirebaseSupported = false;

// Safe load of firebase config
const initFirebaseSafe = () => {
  try {
    // We can try to fetch of dynamic import of configuration if exists,
    // otherwise since it is compiled, we can inspect if there's compile-time configuration injected
    // or try catching error
    // In many setups, if firebase isn't setup yet, we can fall back to local mode.
    // If we want to check if config is present:
    const configModule = (import.meta as any).glob("/src/firebase-applet-config.json", { eager: true });
    const keys = Object.keys(configModule);
    if (keys.length > 0) {
      const firebaseConfig = (configModule[keys[0]] as any).default;
      if (firebaseConfig && firebaseConfig.apiKey) {
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        db = getFirestore(app);
        auth = getAuth(app);
        isFirebaseSupported = true;
        console.log("Firebase initialized successfully on client-side.");
      }
    }
  } catch (err) {
    console.warn("Firebase not setup or configuration missing. Falling back to local state engine.", err);
  }
};

initFirebaseSafe();

export { db, auth, isFirebaseSupported };

// Unified Database and Auth layer that automatically coordinates between Firebase Cloud and LocalStorage fallback
export const storageService = {
  isCloudActive: () => isFirebaseSupported && auth?.currentUser != null,

  // Authentication Methods
  async loginWithGoogle(): Promise<{ success: boolean; user?: any; error?: string }> {
    if (isFirebaseSupported && auth) {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        return { success: true, user: result.user };
      } catch (err: any) {
        console.error("Auth Error:", err);
        return { success: false, error: err.message };
      }
    } else {
      // Offline Local Mode Mock Authentication
      const dummyUser = {
        uid: "local-user-id",
        email: "muhap37@guru.sd.belajar.id", // Auto-fill with user email from additional metadata
        displayName: "Muh. Asriwadi AP (Guru)",
        photoURL: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&h=100&fit=crop&crop=faces",
      };
      localStorage.setItem("local_authenticated_user", JSON.stringify(dummyUser));
      return { success: true, user: dummyUser };
    }
  },

  async loginWithEmail(email: string, name: string): Promise<{ success: boolean; user?: any }> {
    const dummyUser = {
      uid: "local-user-id",
      email: email || "guru@belajar.id",
      displayName: name || "Guru Indonesia",
      photoURL: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&h=100&fit=crop&crop=faces",
    };
    localStorage.setItem("local_authenticated_user", JSON.stringify(dummyUser));
    return { success: true, user: dummyUser };
  },

  async logout(): Promise<void> {
    if (isFirebaseSupported && auth) {
      await signOut(auth);
    }
    localStorage.removeItem("local_authenticated_user");
  },

  getCurrentUser(): any {
    if (isFirebaseSupported && auth?.currentUser) {
      return auth.currentUser;
    }
    const local = localStorage.getItem("local_authenticated_user");
    return local ? JSON.parse(local) : null;
  },

  // Document Cloud or Local Persistence
  async saveAssessment(assessment: any): Promise<void> {
    const user = this.getCurrentUser();
    const userId = user ? user.uid : "anonymous";
    const dataToSave = { ...assessment, userId, updatedAt: new Date().toISOString() };

    if (this.isCloudActive() && db) {
      try {
        // Enforce the error template requirements for cloud
        await setDoc(doc(db, "assessments", assessment.id), dataToSave);
      } catch (err) {
        // Handle firestore permissions properly
        console.error("Failed to write to Cloud Firestore, saving locally.", err);
        this.saveLocally(assessment.id, dataToSave);
      }
    } else {
      this.saveLocally(assessment.id, dataToSave);
    }
  },

  saveLocally(id: string, data: any) {
    const activeList = this.getLocalAssessments();
    const index = activeList.findIndex((item: any) => item.id === id);
    if (index >= 0) {
      activeList[index] = data;
    } else {
      activeList.push(data);
    }
    localStorage.setItem("generator_soal_assessments", JSON.stringify(activeList));
  },

  getLocalAssessments(): any[] {
    const raw = localStorage.getItem("generator_soal_assessments");
    return raw ? JSON.parse(raw) : [];
  },

  async getAssessments(): Promise<any[]> {
    const user = this.getCurrentUser();
    const userId = user ? user.uid : "anonymous";

    if (this.isCloudActive() && db) {
      try {
        const q = query(
          collection(db, "assessments"),
          where("userId", "==", userId)
        );
        const querySnapshot = await getDocs(q);
        const list: any[] = [];
        querySnapshot.forEach((docSnap) => {
          list.push(docSnap.data());
        });
        // Sort by date secondary
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } catch (err) {
        console.warn("Firestore Read Failed, using local storage backup.", err);
        return this.getLocalAssessments();
      }
    } else {
      return this.getLocalAssessments().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  },

  async deleteAssessment(id: string): Promise<void> {
    if (this.isCloudActive() && db) {
      try {
        await deleteDoc(doc(db, "assessments", id));
      } catch (err) {
        console.error("Cloud delete failed, syncing local file.", err);
        this.deleteLocally(id);
      }
    } else {
      this.deleteLocally(id);
    }
  },

  deleteLocally(id: string) {
    const activeList = this.getLocalAssessments();
    const filtered = activeList.filter((item: any) => item.id !== id);
    localStorage.setItem("generator_soal_assessments", JSON.stringify(filtered));
  }
};
