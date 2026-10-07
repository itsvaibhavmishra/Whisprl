import { createContext, useEffect } from "react";
import { SETTINGS_STORAGE_KEY, defaultSettings } from "@/config";
import useLocalStorage from "@/hooks/useLocalStorage";

const initialState = {
  ...defaultSettings,
  onToggleMode: () => {},
  onChangeMode: () => {},
  onChangeDirectionByLang: () => {},
  onChangeColor: () => {},
  onToggleSounds: () => {},
  onSetNotifications: () => {},
  onToggle24Hour: () => {},
  onSetWallpaper: () => {},
  onToggleDoodles: () => {},
};

const SettingsContext = createContext(initialState);

const SettingsProvider = ({ children }) => {
  const [stored, setSettings] = useLocalStorage(SETTINGS_STORAGE_KEY, defaultSettings);
  // settings saved by an older version lack the newer keys, so each falls back to its default
  const settings = { ...defaultSettings, ...stored };

  const isArabic = localStorage.getItem("i18nextLng") === "ar";

  useEffect(() => {
    if (isArabic) {
      onChangeDirectionByLang("ar");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isArabic]);

  const onToggleMode = () => {
    const showingLight =
      settings.themeMode === "system"
        ? !window.matchMedia("(prefers-color-scheme: dark)").matches
        : settings.themeMode === "light";
    setSettings({ ...settings, themeMode: showingLight ? "dark" : "light" });
  };

  const onChangeMode = (event) => {
    setSettings({ ...settings, themeMode: event.target.value });
  };

  const onChangeDirectionByLang = (lang) => {
    setSettings({ ...settings, themeDirection: lang === "ar" ? "rtl" : "ltr" });
  };

  const onChangeColor = (event) => {
    setSettings({ ...settings, themeColorPresets: event.target.value });
  };

  const onToggleSounds = () => {
    setSettings({ ...settings, sounds: !settings.sounds });
  };

  const onSetNotifications = (notifications) => {
    setSettings({ ...settings, notifications });
  };

  const onToggle24Hour = () => {
    setSettings({ ...settings, use24Hour: !settings.use24Hour });
  };

  const { wallpapers } = settings;

  // null sets a chat back to the wallpaper every chat uses
  const onSetWallpaper = (wallpaper, conversationId) => {
    if (!conversationId) {
      setSettings({ ...settings, wallpapers: { ...wallpapers, all: wallpaper } });
      return;
    }
    const { [conversationId]: _, ...others } = wallpapers.chats;
    const chats = wallpaper ? { ...others, [conversationId]: wallpaper } : others;
    setSettings({ ...settings, wallpapers: { ...wallpapers, chats } });
  };

  const onToggleDoodles = () => {
    setSettings({ ...settings, wallpapers: { ...wallpapers, doodles: !wallpapers.doodles } });
  };

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        onToggleMode,
        onChangeMode,
        onChangeDirectionByLang,
        onChangeColor,
        onToggleSounds,
        onSetNotifications,
        onToggle24Hour,
        onSetWallpaper,
        onToggleDoodles,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export { SettingsContext };

export default SettingsProvider;
