package com.vaibhaw.whisprl;

import android.content.Context;
import android.content.SharedPreferences;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

// text messages pushed while the app is not running, kept sealed as they came so the next launch shows them before the server answers
final class ArrivedMessages {

    private static final String STORE = "arrived-messages";
    private static final String MESSAGES = "messages";
    // the server fills in anything older once the app is open
    private static final int MOST_KEPT = 200;

    private static boolean isAppRunning = false;

    private ArrivedMessages() {}

    static synchronized void setAppRunning(boolean isRunning) {
        isAppRunning = isRunning;
    }

    // a running app hears every message over its own connection
    static synchronized void keep(Context context, Map<String, String> data) {
        if (isAppRunning) return;
        JSONArray kept = read(context);
        kept.put(new JSONObject(data));
        JSONArray newest = new JSONArray();
        for (int index = Math.max(0, kept.length() - MOST_KEPT); index < kept.length(); index++) newest.put(kept.opt(index));
        store(context).edit().putString(MESSAGES, newest.toString()).commit();
    }

    static synchronized JSONArray take(Context context) {
        JSONArray kept = read(context);
        store(context).edit().remove(MESSAGES).commit();
        return kept;
    }

    private static JSONArray read(Context context) {
        try {
            return new JSONArray(store(context).getString(MESSAGES, "[]"));
        } catch (JSONException error) {
            return new JSONArray();
        }
    }

    private static SharedPreferences store(Context context) {
        return context.getSharedPreferences(STORE, Context.MODE_PRIVATE);
    }
}
