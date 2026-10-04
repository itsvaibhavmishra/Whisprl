import { createContext, useEffect } from "react";
import { defaultSettings } from "../config";
import getColorPresets, { defaultPreset } from "../utils/getColorPresets";
import useLocalStorage from "../hooks/useLocalStorage";

const initialState = {
  ...defaultSettings,
  onToggleMode: () => {},
  onChangeMode: () => {},
  onChangeDirectionByLang: () => {},
  onChangeColor: () => {},
  setColor: defaultPreset,
};

const SettingsContext = createContext(initialState);

const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useLocalStorage("settings", defaultSettings);

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

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        onToggleMode,
        onChangeMode,
        onChangeDirectionByLang,
        onChangeColor,
        setColor: getColorPresets(settings.themeColorPresets),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export { SettingsContext };

export default SettingsProvider;
