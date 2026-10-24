package com.vaibhaw.whisprl;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "ArrivedMessages")
public class ArrivedMessagesPlugin extends Plugin {

    private static final String[] PASSED_ON = { "messageId", "conversationId", "senderId", "createdAt", "expiresAt" };

    @Override
    public void load() {
        ArrivedMessages.setAppRunning(true);
    }

    @Override
    protected void handleOnDestroy() {
        ArrivedMessages.setAppRunning(false);
    }

    // opened only when asked for, so what waits on the phone is never more readable than what the server holds
    @PluginMethod
    public void take(PluginCall call) {
        String userId = call.getString("userId");
        JSONArray kept = ArrivedMessages.take(getContext());
        JSONObject vaultedKey = kept.length() == 0 ? null : vaultedKeyOrNull(userId);
        JSArray messages = new JSArray();
        for (int index = 0; index < kept.length(); index++) {
            Map<String, String> data = mapOf(kept.optJSONObject(index));
            String plaintext = plaintextOrNull(data, vaultedKey);
            if (plaintext != null) messages.put(messageOf(data, plaintext));
        }
        JSObject result = new JSObject();
        result.put("messages", messages);
        call.resolve(result);
    }

    private JSONObject vaultedKeyOrNull(String userId) {
        try {
            return SealedMessage.vaultedKeyOf(getContext(), userId);
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            return null;
        } catch (Exception error) {
            return null;
        }
    }

    // a message that cannot be opened is left for the server to fill in
    private static String plaintextOrNull(Map<String, String> data, JSONObject vaultedKey) {
        try {
            return SealedMessage.plaintextOf(data, vaultedKey);
        } catch (Exception error) {
            return null;
        }
    }

    private static JSObject messageOf(Map<String, String> data, String plaintext) {
        JSObject message = new JSObject();
        for (String name : PASSED_ON) if (data.containsKey(name)) message.put(name, data.get(name));
        message.put("plaintext", plaintext);
        return message;
    }

    private static Map<String, String> mapOf(JSONObject json) {
        Map<String, String> data = new HashMap<>();
        for (Iterator<String> names = json.keys(); names.hasNext(); ) {
            String name = names.next();
            data.put(name, json.optString(name));
        }
        return data;
    }
}
