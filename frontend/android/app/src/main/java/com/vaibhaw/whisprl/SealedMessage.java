package com.vaibhaw.whisprl;

import android.content.Context;
import android.util.Base64;
import com.google.android.gms.auth.blockstore.Blockstore;
import com.google.android.gms.auth.blockstore.RetrieveBytesRequest;
import com.google.android.gms.auth.blockstore.RetrieveBytesResponse.BlockstoreData;
import com.google.android.gms.tasks.Tasks;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import org.json.JSONObject;

// a pushed message as the server sent it, opened on the phone with the key keyVault.js keeps
final class SealedMessage {

    private static final long KEY_WAIT_SECONDS = 5;

    private SealedMessage() {}

    // read under the name keyVault.js stores it with
    static JSONObject vaultedKeyOf(Context context, String userId) throws Exception {
        String name = "device-keys:" + userId;
        RetrieveBytesRequest request = new RetrieveBytesRequest.Builder().setKeys(Collections.singletonList(name)).build();
        BlockstoreData stored = Tasks.await(Blockstore.getClient(context).retrieveBytes(request), KEY_WAIT_SECONDS, TimeUnit.SECONDS)
            .getBlockstoreDataMap()
            .get(name);
        return stored == null ? null : new JSONObject(new String(stored.getBytes(), StandardCharsets.UTF_8));
    }

    static String plaintextOf(Map<String, String> data, JSONObject vaultedKey) throws Exception {
        if (vaultedKey == null || !vaultedKey.optString("keyId").equals(data.get("keyId"))) return null;
        return opened(data, Base64.decode(vaultedKey.getString("pkcs8"), Base64.DEFAULT));
    }

    // a group message's own key is sealed with the pair key, where a direct message is sealed with the pair key itself
    private static String opened(Map<String, String> data, byte[] pkcs8) throws GeneralSecurityException {
        String conversationId = data.get("conversationId");
        String context = MessageCipher.contextOf(conversationId, data.get("senderId"));
        byte[] pairKey = MessageCipher.pairKey(pkcs8, decoded(data, "senderPublicKey"), conversationId);
        byte[] messageKey = data.containsKey("sealedData")
            ? MessageCipher.open(pairKey, decoded(data, "sealedIv"), decoded(data, "sealedData"), context)
            : pairKey;
        return new String(MessageCipher.open(messageKey, decoded(data, "cipherIv"), decoded(data, "cipherData"), context), StandardCharsets.UTF_8);
    }

    private static byte[] decoded(Map<String, String> data, String name) {
        return Base64.decode(data.get(name), Base64.DEFAULT);
    }
}
