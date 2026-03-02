import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  writeBatch, 
  query, 
  where, 
  getDocs,
  getDoc,
  Timestamp,
  or,
  and
} from 'firebase/firestore';
import { Drop, DropContent } from '@/types';

// Convert Unix milliseconds to Firestore Timestamp for queries/writes
function unixToTimestamp(unixMillis: number): Timestamp {
  return Timestamp.fromMillis(unixMillis);
}

/**
 * Creates a new drop and its encrypted vault securely using a Firestore WriteBatch.
 * Ensures an atomic write: both succeed, or both fail.
 */
export async function createDrop(
  dropMetadata: Omit<Drop, 'drop_id'>,
  dropVault: Omit<DropContent, 'drop_id'>
): Promise<string> {
  const batch = writeBatch(db);
  
  // Create a new reference in the "drops" collection
  const dropRef = doc(collection(db, 'drops'));
  const dropId = dropRef.id;

  // Set the precise metadata document
  batch.set(dropRef, {
    ...dropMetadata,
    drop_id: dropId,
    // Convert timestamps to Firestore native types
    expires_at: unixToTimestamp(dropMetadata.expires_at),
    created_at: unixToTimestamp(dropMetadata.created_at)
  });

  // Set the secret vault document matching the DROP_ID
  const vaultRef = doc(db, 'drop_contents', dropId);
  batch.set(vaultRef, {
    ...dropVault,
    drop_id: dropId,
  });

  // Execute atomic write
  await batch.commit();

  return dropId;
}

/**
 * Fetches drops near the user's geohash grids, enforcing visibility rules based on guest status.
 */
export async function getNearbyDrops(
  geohashes: string[], // 9-item array of the surround geohashes (current + 8 neighbors)
  userId: string | null, 
  isAnonymous: boolean
): Promise<Drop[]> {
  if (geohashes.length === 0) return [];
  
  // Note: Firebase `in` queries are limited to max 30 items, and 9 is well within limits.
  const dropsRef = collection(db, 'drops');

  let q;
  
  // We remove the strict "expires_at > now" from the backend query to avoid complex Firestore
  // Composite Index requirement errors being silently spawned. We will filter expirations on the client instead.
  if (isAnonymous || !userId) {
    // GUESTS: Can ONLY see PUBLIC drops within the location.
    q = query(
      dropsRef,
      where('geohash', 'in', geohashes),
      where('visibility_type', '==', 'PUBLIC')
    );
  } else {
    // AUTHENTICATED USERS: Can see PUBLIC drops OR PRIVATE drops where they are targeted
    q = query(
      dropsRef,
      and(
        where('geohash', 'in', geohashes),
        or(
          where('visibility_type', '==', 'PUBLIC'),
          where('allowed_users', 'array-contains', userId)
        )
      )
    );
  }

  const querySnapshot = await getDocs(q);
  const nowMillis = Date.now();
  
  return querySnapshot.docs.reduce((acc, docSnapshot) => {
    const data = docSnapshot.data();
    const expiresAt = data.expires_at?.toMillis() || 0;
    
    // Client-side expiration filtering
    if (expiresAt > nowMillis) {
      acc.push({
        ...data,
        drop_id: docSnapshot.id,
        expires_at: expiresAt,
        created_at: data.created_at?.toMillis() || 0,
      } as Drop);
    }
    return acc;
  }, [] as Drop[]);
}

/**
 * Fetches the encrypted vault contents for a specific drop ID.
 */
export async function getDropContent(dropId: string): Promise<DropContent | null> {
  const docRef = doc(db, 'drop_contents', dropId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as DropContent;
  }
  return null;
}

/**
 * Atomically deletes a Drop and its corresponding Secret Vault from Firestore.
 */
export async function deleteDrop(dropId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'drops', dropId));
  batch.delete(doc(db, 'drop_contents', dropId));
  await batch.commit();
}

/**
 * Checks if a guest user has exceeded their daily drop limit (max 2 per day).
 */
export async function canGuestDrop(userId: string): Promise<boolean> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayMillis = startOfDay.getTime();

  const dropsRef = collection(db, 'drops');
  const q = query(
    dropsRef,
    where('creator_id', '==', userId)
  );

  const querySnapshot = await getDocs(q);
  
  let todayDropsCount = 0;
  for (const docSnap of querySnapshot.docs) {
    const data = docSnap.data();
    const createdAt = data.created_at?.toMillis() || 0;
    if (createdAt >= startOfDayMillis) {
      todayDropsCount++;
    }
  }

  return todayDropsCount < 2;
}
