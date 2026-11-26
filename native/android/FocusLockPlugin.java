package com.feit.app;

import android.app.ActivityManager;
import android.content.Context;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Android screen pinning for Feit focus sessions. */
@CapacitorPlugin(name = "FocusLock")
public class FocusLockPlugin extends Plugin {

    private boolean isLocked() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return false;
        ActivityManager manager = (ActivityManager) getContext().getSystemService(Context.ACTIVITY_SERVICE);
        return manager != null && manager.getLockTaskModeState() != ActivityManager.LOCK_TASK_MODE_NONE;
    }

    @PluginMethod()
    public void start(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                if (!isLocked()) getActivity().startLockTask();
                JSObject result = new JSObject();
                result.put("locked", isLocked());
                call.resolve(result);
            } catch (Exception error) {
                call.reject("focus-lock-start", error.getMessage());
            }
        });
    }

    @PluginMethod()
    public void stop(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                if (isLocked()) getActivity().stopLockTask();
                call.resolve();
            } catch (Exception error) {
                call.reject("focus-lock-stop", error.getMessage());
            }
        });
    }

    @PluginMethod()
    public void isLocked(PluginCall call) {
        JSObject result = new JSObject();
        result.put("locked", isLocked());
        call.resolve(result);
    }
}
