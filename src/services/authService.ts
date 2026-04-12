import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../lib/firebase';
import { User } from '../types';

export class AuthService {
  /** Register a passenger (legacy — kept for compatibility). */
  static async register(
    email: string,
    password: string,
    name: string,
    phone: string,
  ): Promise<User> {
    return this._createUser(email, password, name, phone, 'passenger');
  }

  /** Register a driver. Creates the Firebase Auth account + users doc with userType:'driver'. */
  static async registerDriver(
    email: string,
    password: string,
    name: string,
    phone: string,
  ): Promise<User> {
    return this._createUser(email, password, name, phone, 'driver');
  }

  private static async _createUser(
    email: string,
    password: string,
    name: string,
    phone: string,
    userType: 'passenger' | 'driver',
  ): Promise<User> {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    const user: User = {
      id: cred.user.uid,
      email,
      name,
      phone,
      userType,
      rating: 0,
      fcmToken: null,
      pushToken: null,
      createdAt: new Date(),
    };

    await setDoc(doc(firestore, 'users', user.id), user);
    return user;
  }

  static async login(email: string, password: string): Promise<User> {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(firestore, 'users', cred.user.uid));
    if (!snap.exists()) throw new Error('User document not found');
    return snap.data() as User;
  }

  static async logout(): Promise<void> {
    await signOut(auth);
  }

  static async getUser(userId: string): Promise<User | null> {
    const snap = await getDoc(doc(firestore, 'users', userId));
    return snap.exists() ? (snap.data() as User) : null;
  }

  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    await setDoc(doc(firestore, 'users', userId), updates, { merge: true });
  }

  /** Sends a password reset email. Throws if the address is not registered. */
  static async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  static onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }
}
