import { createContext, useEffect } from "react";
import { SETTINGS_STORAGE_KEY, defaultSettings } from "@/config";
import getColorPresets, { defaultPreset } from "@/utils/getColorPresets";
import useLocalStorage from "@/hooks/useLocalStorage";

const initialState = {
  ...defaultSettings,
  onToggleMode: () => {},
  onChangeMode: () => {},
  onChangeDirectionByLang: () => {},
  onChangeColor: () => {},
  onToggleSounds: () => {},
  onSetNotifications: () => {},
  setColor: defaultPreset,
};

const SettingsContext = createContext(initialState);

const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useLocalStorage(SETTINGS_STORAGE_KEY, defaultSettings);

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

  const soundsOn = settings.sounds !== false;

  const onToggleSounds = () => {
    setSettings({ ...settings, sounds: !soundsOn });
  };

  const onSetNotifications = (notifications) => {
    setSettings({ ...settings, notifications });
  };

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        sounds: soundsOn,
        onToggleMode,
        onChangeMode,
        onChangeDirectionByLang,
        onChangeColor,
        onToggleSounds,
        onSetNotifications,
        setColor: getColorPresets(settings.themeColorPresets),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export { SettingsContext };

export default SettingsProvider;
