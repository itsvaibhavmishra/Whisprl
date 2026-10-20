package com.vaibhaw.whisprl;

import android.os.Build;
import android.view.HapticFeedbackConstants;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// the phone's own touch feedback rather than a raw vibration, so it follows the system's settings and needs no permission
@CapacitorPlugin(name = "Haptics")
public class HapticsPlugin extends Plugin {

    private static final boolean HAS_OUTCOME_FEEDBACK = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R;

    private static int feedbackFor(String kind) {
        switch (kind) {
            case "press":
                return HapticFeedbackConstants.LONG_PRESS;
            case "tick":
                return HapticFeedbackConstants.CLOCK_TICK;
            case "confirm":
                return HAS_OUTCOME_FEEDBACK ? HapticFeedbackConstants.CONFIRM : HapticFeedbackConstants.CONTEXT_CLICK;
            case "reject":
                return HAS_OUTCOME_FEEDBACK ? HapticFeedbackConstants.REJECT : HapticFeedbackConstants.LONG_PRESS;
            default:
                return HapticFeedbackConstants.CONTEXT_CLICK;
        }
    }

    @PluginMethod
    public void feel(PluginCall call) {
        int feedback = feedbackFor(call.getString("kind", "tap"));
        getActivity().runOnUiThread(() -> getBridge().getWebView().performHapticFeedback(feedback));
        call.resolve();
    }
}
