import { configureStore } from "@reduxjs/toolkit";
import {
  useDispatch as useAppDispatch,
  useSelector as useAppSelector,
} from "react-redux";
import { persistStore, persistReducer } from "redux-persist";
import { rootPersistConfig, rootReducer } from "@/redux/rootReducer";

const isProduction = process.env.REACT_APP_NODE !== "local";

// If it's production, exclude Redux DevTools Extension
const devToolsOptions = {
  devTools: !isProduction,
};

const store = configureStore({
  reducer: persistReducer(rootPersistConfig, rootReducer),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
  ...devToolsOptions,
});

const persistor = persistStore(store);
const { dispatch } = store;

const useSelector = useAppSelector;
const useDispatch = () => useAppDispatch();

export { store, persistor, dispatch, useSelector, useDispatch };
