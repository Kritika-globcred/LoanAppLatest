
'use client';

import { v4 as uuidv4 } from 'uuid';

const USER_ID_KEY = 'app_user_id';

export function getOrGenerateUserId(): string {
  if (typeof window === 'undefined') {
    // Should not be called server-side without a proper context
    // For now, returning a placeholder or throwing an error might be appropriate
    // depending on server-side usage needs.
    // console.warn("[User Utils] getOrGenerateUserId called on server without window context. Returning temporary ID.");
    return `server-temp-${uuidv4()}`; // Or handle as an error
  }

  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem(USER_ID_KEY, userId);
    console.log(`[User Utils] Generated new userId: ${userId}`);
  } else {
    // console.log(`[User Utils] Using existing userId: ${userId}`);
  }
  return userId;
}

// You might also want a function to clear it for testing, if needed
export function clearUserId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_ID_KEY);
    console.log("[User Utils] Cleared userId from localStorage.");
  }
}
