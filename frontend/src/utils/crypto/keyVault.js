import { registerPlugin } from "@capacitor/core";

import { fromBase64, toBase64 } from "@/utils/crypto/encoding";
import { exportPrivateKey, importPrivateKey } from "@/utils/crypto/keys";
import { isApp } from "@/utils/platform";

const KeyVault = registerPlugin("KeyVault");

const nameFor = (userId) => `device-keys:${userId}`;

export const vaultDeviceKeys = async (userId, { keyId, privateKey }) => {
  if (!isApp) return;
  const pkcs8 = toBase64(await exportPrivateKey(privateKey));
  await KeyVault.save({ name: nameFor(userId), value: JSON.stringify({ keyId, pkcs8 }) });
};

export const vaultedDeviceKeys = async (userId) => {
  if (!isApp) return null;
  const { value } = await KeyVault.load({ name: nameFor(userId) });
  if (!value) return null;
  const { keyId, pkcs8 } = JSON.parse(value);
  return { keyId, privateKey: await importPrivateKey(fromBase64(pkcs8)) };
};

export const forgetVaultedKeys = async (userId) => {
  if (isApp) await KeyVault.remove({ name: nameFor(userId) });
};

export const saveToPasswordManager = async (id, password) => (await KeyVault.savePassword({ id, password })).outcome;

// the password manager outlives a reinstall even with the phone's backup off, so the recovery key saved there can be picked instead of typed
export const pickFromPasswordManager = () => KeyVault.pickPassword();

export const canConfirmOwner = async () => isApp && (await KeyVault.canConfirmOwner()).canConfirm;

export const confirmOwner = async (reason) => {
  if (!isApp) return true;
  const { confirmed } = await KeyVault.confirmOwner({ title: "Confirm it's you", subtitle: reason });
  return confirmed;
};
