package com.vaibhaw.whisprl;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThrows;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.GeneralSecurityException;
import java.util.Base64;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.junit.BeforeClass;
import org.junit.Test;

// the vectors were sealed by the web app's own cipher, so opening them here proves the two agree
public class MessageCipherTest {

    private static JSONObject recipient;
    private static JSONObject sender;
    private static JSONArray messages;

    @BeforeClass
    public static void readVectors() throws Exception {
        JSONObject vectors = new JSONObject(new String(Files.readAllBytes(Paths.get("../../src/utils/crypto/messageVectors.json")), StandardCharsets.UTF_8));
        recipient = vectors.getJSONObject("recipient");
        sender = vectors.getJSONObject("sender");
        messages = vectors.getJSONArray("messages");
    }

    private static byte[] decoded(JSONObject json, String name) throws JSONException {
        return Base64.getDecoder().decode(json.getString(name));
    }

    private static String plaintextOf(JSONObject message) throws GeneralSecurityException, JSONException {
        String conversationId = message.getString("conversationId");
        String context = MessageCipher.contextOf(conversationId, sender.getString("id"));
        byte[] pairKey = MessageCipher.pairKey(decoded(recipient, "pkcs8"), decoded(sender, "publicKey"), conversationId);
        byte[] messageKey = message.has("sealedData")
            ? MessageCipher.open(pairKey, decoded(message, "sealedIv"), decoded(message, "sealedData"), context)
            : pairKey;
        return new String(MessageCipher.open(messageKey, decoded(message, "iv"), decoded(message, "data"), context), StandardCharsets.UTF_8);
    }

    @Test
    public void opensEveryMessageTheWebSealed() throws Exception {
        for (int index = 0; index < messages.length(); index++) {
            JSONObject message = messages.getJSONObject(index);
            assertEquals(message.getString("plaintext"), plaintextOf(message));
        }
    }

    @Test
    public void refusesAMessageMovedToAnotherConversation() throws JSONException {
        JSONObject moved = new JSONObject(messages.getJSONObject(0).toString()).put("conversationId", "6ad4d1c68f3347e14ac56699");
        assertThrows(GeneralSecurityException.class, () -> plaintextOf(moved));
    }
}
