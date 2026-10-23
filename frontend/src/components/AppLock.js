import { useEffect, useRef, useState } from "react";
import { Button, Stack, Typography } from "@mui/material";
import { App } from "@capacitor/app";
import { LockSimpleOpen } from "phosphor-react";
import { useSelector } from "react-redux";

import MascotHalo from "@/components/MascotHalo";
import Wordmark from "@/components/Wordmark";
import useSettings from "@/hooks/useSettings";
import { confirmOwner } from "@/utils/crypto/keyVault";
import { isApp } from "@/utils/platform";
import { carriedOver } from "@/utils/updateCarryOver";

const AWAY_BEFORE_LOCKING_MS = 60 * 1000;

const AppLock = () => {
  const { appLock } = useSettings();
  const isRehydrated = useSelector((state) => state._persist?.rehydrated);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  // a cold start always asks, so the lock starts out closed; a live update's reload carries on as the app was left
  const [isLocked, setIsLocked] = useState(() => carriedOver()?.isLocked ?? true);
  const [isAsking, setIsAsking] = useState(false);
  const leftAt = useRef(carriedOver()?.leftAt ?? null);
  const wasOn = useRef(appLock);
  const isShown = isApp && appLock && isLoggedIn && isLocked;

  // whoever just switched it on has just proved who they are
  useEffect(() => {
    if (appLock && !wasOn.current) setIsLocked(false);
    wasOn.current = appLock;
  }, [appLock]);

  // a fresh login has proved it too, so only a session carried over from before starts locked
  useEffect(() => {
    if (isRehydrated && !isLoggedIn) setIsLocked(false);
  }, [isRehydrated, isLoggedIn]);

  useEffect(() => {
    if (!isApp) return undefined;
    const listening = App.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) {
        leftAt.current = Date.now();
        return;
      }
      if (leftAt.current && Date.now() - leftAt.current >= AWAY_BEFORE_LOCKING_MS) setIsLocked(true);
      leftAt.current = null;
    });
    return () => listening.then((listener) => listener.remove());
  }, []);

  const unlock = async () => {
    setIsAsking(true);
    const isConfirmed = await confirmOwner("Unlock Whisprl").catch(() => false);
    setIsAsking(false);
    if (isConfirmed) setIsLocked(false);
  };

  // asked for straight away, so opening the app goes straight to the fingerprint
  useEffect(() => {
    if (isShown) unlock();
  }, [isShown]);

  if (!isShown) return null;

  return (
    <Stack
      data-app-locked
      role="dialog"
      aria-modal="true"
      aria-label="Whisprl is locked"
      alignItems="center"
      justifyContent="center"
      spacing={2}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: (theme) => theme.zIndex.tooltip + 1,
        px: 3,
        pt: "env(safe-area-inset-top)",
        pb: "env(safe-area-inset-bottom)",
        textAlign: "center",
        bgcolor: "background.default",
      }}
    >
      <MascotHalo size={150} />
      <Typography component="h1" sx={{ m: 0 }}>
        <Wordmark name="Whisprl" fontSize="2.75rem" />
      </Typography>
      <Typography sx={{ maxWidth: 300, fontSize: 15, fontWeight: 500, color: "text.secondary" }}>Unlock with your fingerprint, face or screen lock.</Typography>
      <Button variant="contained" size="large" startIcon={<LockSimpleOpen size={20} weight="bold" />} onClick={unlock} disabled={isAsking} sx={{ borderRadius: 99, px: 3 }}>
        Unlock
      </Button>
    </Stack>
  );
};

export default AppLock;
