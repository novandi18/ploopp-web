import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  runTransaction, 
  increment,
  getDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  FieldValue,
  writeBatch
} from 'firebase/firestore';

export interface LeaderboardEntry {
  uid: string;
  username: string;
  total_points: number;
  rank_tier: string;
  last_updated: Timestamp | FieldValue;
}

const getRankTier = (points: number): string => {
  if (points >= 1000) return 'Diamond';
  if (points >= 500) return 'Platinum';
  if (points >= 250) return 'Gold';
  if (points >= 100) return 'Silver';
  return 'Bronze';
};

export async function addPoints(userId: string, isAnonymous: boolean, points: number) {
  if (isAnonymous || !userId) return;

  const userRef = doc(db, 'users', userId);
  const leaderRef = doc(db, 'leaderboards', userId);

  await runTransaction(db, async (transaction) => {
    const leaderSnap = await transaction.get(leaderRef);
    const userSnap = await transaction.get(userRef);

    let username = 'Unknown Explorer';
    if (userSnap.exists() && userSnap.data().username) {
      username = userSnap.data().username;
    }

    const currentPoints = leaderSnap.exists() && typeof leaderSnap.data().total_points === 'number' 
      ? leaderSnap.data().total_points 
      : 0;
    const newPoints = Math.round(currentPoints + points);

    transaction.set(leaderRef, {
      uid: userId,
      username,
      total_points: newPoints,
      rank_tier: getRankTier(newPoints),
      last_updated: serverTimestamp()
    }, { merge: true });
    
    // Auto-create basic user document if it doesn't exist
    if (!userSnap.exists()) {
      transaction.set(userRef, { 
        is_anonymous: false, 
        username: 'Unknown Explorer' 
      });
    }
  });
}

export async function updateUsername(userId: string, newUsername: string) {
  if (!userId || !newUsername) return;
  const userRef = doc(db, 'users', userId);
  const leaderRef = doc(db, 'leaderboards', userId);

  const batch = writeBatch(db);
  batch.set(userRef, { username: newUsername, is_anonymous: false }, { merge: true });
  batch.set(leaderRef, { username: newUsername }, { merge: true });
  
  await batch.commit();
}

export async function handleDropFound(finderId: string, isFinderAnonymous: boolean, creatorId: string) {
  if (!isFinderAnonymous && finderId) {
    // Finder gets +10
    await addPoints(finderId, false, 10);
  }

  if (creatorId && creatorId !== finderId) {
    // Creator gets +2 if someone else found it
    const creatorUserRef = doc(db, 'users', creatorId);
    const creatorSnap = await getDoc(creatorUserRef);
    if (creatorSnap.exists() && !creatorSnap.data().is_anonymous) {
      await addPoints(creatorId, false, 2);
    }
  }
}

export async function handleDropCreated(creatorId: string, isAnonymous: boolean) {
  if (!isAnonymous && creatorId) {
    // Creator gets +5
    await addPoints(creatorId, false, 5);
  }
}

export async function getTopPlayers(): Promise<LeaderboardEntry[]> {
  const q = query(
    collection(db, 'leaderboards'),
    orderBy('total_points', 'desc'),
    limit(20)
  );

  const snap = await getDocs(q);
  return snap.docs.map(doc => doc.data() as LeaderboardEntry);
}

export async function getUserRank(userId: string): Promise<LeaderboardEntry | null> {
  const docRef = doc(db, 'leaderboards', userId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as LeaderboardEntry;
  }
  return null;
}
