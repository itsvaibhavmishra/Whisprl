const DATABASE = "whisprl";
const DEVICE_KEYS = "device-keys";
const SESSION_KEYS = "session-keys";
const VERSION = 2;

const openDatabase = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      [DEVICE_KEYS, SESSION_KEYS]
        .filter((name) => !database.objectStoreNames.contains(name))
        .forEach((name) => database.createObjectStore(name));
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

// a write counts once it is on disk, so a key saved just before the browser closes is still there when it opens again
const inStore = async (storeName, mode, operation) => {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, mode, { durability: "strict" });
      const request = operation(transaction.objectStore(storeName));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(transaction.error ?? request.error);
    });
  } finally {
    database.close();
  }
};

export const loadDeviceKeys = (userId) => inStore(DEVICE_KEYS, "readonly", (store) => store.get(userId));

export const saveDeviceKeys = (userId, deviceKeys) => inStore(DEVICE_KEYS, "readwrite", (store) => store.put(deviceKeys, userId));

export const forgetDeviceKeys = (userId) => inStore(DEVICE_KEYS, "readwrite", (store) => store.delete(userId));

export const loadSessionKey = (userId) => inStore(SESSION_KEYS, "readonly", (store) => store.get(userId));

export const saveSessionKey = (userId, session) => inStore(SESSION_KEYS, "readwrite", (store) => store.put(session, userId));

// a session that ended on its own is removed only if no login has replaced it since, and a logout removes whatever is stored
export const forgetSessionKey = (userId, endedSessionId) =>
  inStore(SESSION_KEYS, "readwrite", (store) => {
    const request = store.get(userId);
    request.onsuccess = () => {
      if (!endedSessionId || request.result?.sessionId === endedSessionId) store.delete(userId);
    };
    return request;
  });
