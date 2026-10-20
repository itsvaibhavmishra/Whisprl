package com.vaibhaw.whisprl;

import androidx.activity.BackEventCompat;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// back comes to the page only while it has somewhere to go, so from the top screen Android draws its own way home as the swipe moves
@CapacitorPlugin(name = "BackGesture")
public class BackGesturePlugin extends Plugin {

    private final OnBackPressedCallback callback = new OnBackPressedCallback(false) {
        @Override
        public void handleOnBackStarted(BackEventCompat event) {
            notifyListeners("start", new JSObject());
        }

        @Override
        public void handleOnBackProgressed(BackEventCompat event) {
            JSObject swipe = new JSObject();
            swipe.put("progress", event.getProgress());
            notifyListeners("progress", swipe);
        }

        @Override
        public void handleOnBackCancelled() {
            notifyListeners("cancel", new JSObject());
        }

        @Override
        public void handleOnBackPressed() {
            notifyListeners("back", new JSObject());
        }
    };

    @Override
    public void load() {
        getActivity().getOnBackPressedDispatcher().addCallback(getActivity(), callback);
    }

    @PluginMethod
    public void setHandling(PluginCall call) {
        boolean isHandling = call.getBoolean("handling", false);
        getActivity().runOnUiThread(() -> callback.setEnabled(isHandling));
        call.resolve();
    }
}
