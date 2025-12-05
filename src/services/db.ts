import { db } from './firebase';
import { 
  collection, getDocs, addDoc, updateDoc, deleteDoc, // <-- AÑADIDO deleteDoc
  doc, query, getDoc, setDoc, onSnapshot 
} from 'firebase/firestore';
import { MonthlyExpense, Category, ClosingConfig, MonthlyReport } from '../types';
// ... el resto del código es el mismo ...
