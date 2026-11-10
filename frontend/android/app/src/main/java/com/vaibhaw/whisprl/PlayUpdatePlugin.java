package com.vaibhaw.whisprl;

import android.app.Activity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.play.core.appupdate.AppUpdateInfo;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateOptions;
import com.google.android.play.core.install.InstallStateUpdatedListener;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.InstallStatus;
import com.google.android.play.core.install.model.UpdateAvailability;

// the app only ever updates through Play's own screens, as Play's rules require of an app it distributes
@CapacitorPlugin(name = "PlayUpdate")
public class PlayUpdatePlugin extends Plugin {

    private AppUpdateManager manager;

    private final InstallStateUpdatedListener progressListener = (state) -> {
        JSObject event = new JSObject();
        event.put("status", statusName(state.installStatus()));
        event.put("downloaded", state.bytesDownloaded());
        event.put("total", state.totalBytesToDownload());
        notifyListeners("progress", event);
    };

    @Override
    public void load() {
        manager = AppUpdateManagerFactory.create(getContext());
        manager.registerListener(progressListener);
    }

    @Override
    protected void handleOnDestroy() {
        manager.unregisterListener(progressListener);
    }

    // only the states a download passes through; the app shows nothing for any other
    private static String statusName(int status) {
        switch (status) {
            case InstallStatus.PENDING:
                return "pending";
            case InstallStatus.DOWNLOADING:
                return "downloading";
            case InstallStatus.DOWNLOADED:
                return "downloaded";
            case InstallStatus.INSTALLING:
                return "installing";
            default:
                return "idle";
        }
    }

    private static JSObject describe(AppUpdateInfo info) {
        int availability = info.updateAvailability();
        JSObject result = new JSObject();
        result.put("isOffered", availability == UpdateAvailability.UPDATE_AVAILABLE || availability == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS);
        result.put("status", statusName(info.installStatus()));
        result.put("canFlexible", info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE));
        result.put("canImmediate", info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE));
        return result;
    }

    // an install Play did not make, or a phone without Play, fails here, and the app falls back to the listing
    @PluginMethod
    public void check(PluginCall call) {
        manager
            .getAppUpdateInfo()
            .addOnSuccessListener((info) -> call.resolve(describe(info)))
            .addOnFailureListener((error) -> call.reject(error.getMessage(), "UNAVAILABLE"));
    }

    // each AppUpdateInfo starts at most one flow, so a fresh one is read for every start
    @PluginMethod
    public void start(PluginCall call) {
        int type = call.getBoolean("immediate", false) ? AppUpdateType.IMMEDIATE : AppUpdateType.FLEXIBLE;
        Activity activity = getActivity();
        manager
            .getAppUpdateInfo()
            .addOnSuccessListener((info) -> {
                if (!info.isUpdateTypeAllowed(type)) {
                    call.reject("Play has no update to start", "UNAVAILABLE");
                    return;
                }
                manager
                    .startUpdateFlow(info, activity, AppUpdateOptions.newBuilder(type).build())
                    .addOnSuccessListener((code) -> {
                        JSObject result = new JSObject();
                        result.put("isAccepted", code == Activity.RESULT_OK);
                        call.resolve(result);
                    })
                    .addOnFailureListener((error) -> call.reject(error.getMessage(), "FAILED"));
            })
            .addOnFailureListener((error) -> call.reject(error.getMessage(), "UNAVAILABLE"));
    }

    // installs a downloaded update, which restarts the app
    @PluginMethod
    public void finish(PluginCall call) {
        manager
            .completeUpdate()
            .addOnSuccessListener((ignored) -> call.resolve())
            .addOnFailureListener((error) -> call.reject(error.getMessage(), "FAILED"));
    }
}
