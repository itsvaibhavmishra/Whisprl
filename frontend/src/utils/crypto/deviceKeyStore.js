const DATABASE = "whisprl";
const STORE = "device-keys";

const openDatabase = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const inStore = async (mode, operation) => {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = operation(database.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
};

export const loadDeviceKeys = (userId) => inStore("readonly", (store) => store.get(userId));

export const saveDeviceKeys = (userId, deviceKeys) => inStore("readwrite", (store) => store.put(deviceKeys, userId));

export const forgetDeviceKeys = (userId) => inStore("readwrite", (store) => store.delete(userId));
