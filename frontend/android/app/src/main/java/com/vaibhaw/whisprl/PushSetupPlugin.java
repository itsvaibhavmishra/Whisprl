package com.vaibhaw.whisprl;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// a build made without google-services.json has no Firebase, and asking it for a push token would crash the app
@CapacitorPlugin(name = "PushSetup")
public class PushSetupPlugin extends Plugin {

    @PluginMethod
    public void isAvailable(PluginCall call) {
        int firebaseAppId = getContext().getResources().getIdentifier("google_app_id", "string", getContext().getPackageName());
        JSObject result = new JSObject();
        result.put("available", firebaseAppId != 0);
        call.resolve(result);
    }
}
