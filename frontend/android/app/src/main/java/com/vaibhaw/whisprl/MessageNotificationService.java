package com.vaibhaw.whisprl;

import android.app.ActivityManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.util.Base64;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationChannelCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import com.capacitorjs.plugins.pushnotifications.MessagingService;
import com.google.android.gms.auth.blockstore.Blockstore;
import com.google.android.gms.auth.blockstore.RetrieveBytesRequest;
import com.google.android.gms.auth.blockstore.RetrieveBytesResponse.BlockstoreData;
import com.google.android.gms.tasks.Tasks;
import com.google.firebase.messaging.RemoteMessage;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import org.json.JSONObject;

// the server cannot read a message, so it sends the ciphertext and the phone opens it to say what was written
public class MessageNotificationService extends MessagingService {

    private static final String CHANNEL_ID = "messages";
    private static final String FALLBACK_TEXT = "New message";
    private static final long KEY_WAIT_SECONDS = 5;

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        Map<String, String> data = remoteMessage.getData();
        if (data.containsKey("conversationId") && !isOnScreen()) show(remoteMessage.getMessageId(), data);
    }

    // an open app already shows the message in its chat, so only a phone not looking at Whisprl is notified
    private static boolean isOnScreen() {
        ActivityManager.RunningAppProcessInfo process = new ActivityManager.RunningAppProcessInfo();
        ActivityManager.getMyMemoryState(process);
        return process.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND;
    }

    private void show(String messageId, Map<String, String> data) {
        NotificationManagerCompat manager = NotificationManagerCompat.from(this);
        if (!manager.areNotificationsEnabled()) return;
        manager.createNotificationChannel(
            new NotificationChannelCompat.Builder(CHANNEL_ID, NotificationManagerCompat.IMPORTANCE_HIGH).setName("Messages").build()
        );

        String conversationId = data.get("conversationId");
        String sender = data.get("sender");
        String text = textOf(data);
        String body = sender == null ? text : sender + ": " + text;
        manager.notify(
            conversationId,
            0,
            new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_whisprl)
                .setColor(ContextCompat.getColor(this, R.color.notification_accent))
                .setContentTitle(data.get("title"))
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(openChat(messageId, conversationId))
                .build()
        );
    }

    // a message this phone cannot open still gets its notification, only without the words
    private String textOf(Map<String, String> data) {
        // a game invite has nothing secret in it, so its words arrive ready to show
        if (data.containsKey("text")) return data.get("text");
        if (!data.containsKey("cipherData")) return FALLBACK_TEXT;
        try {
            byte[] pkcs8 = privateKeyFor(data.get("recipientId"), data.get("keyId"));
            if (pkcs8 == null) return FALLBACK_TEXT;
            String summary = MessageSummary.of(plaintextOf(data, pkcs8), data.get("kind"));
            return summary.isEmpty() ? FALLBACK_TEXT : summary;
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            return FALLBACK_TEXT;
        } catch (Exception error) {
            return FALLBACK_TEXT;
        }
    }

    // read under the name keyVault.js stores it with, and only if it is the key the message was sealed for
    private byte[] privateKeyFor(String userId, String keyId) throws Exception {
        String name = "device-keys:" + userId;
        RetrieveBytesRequest request = new RetrieveBytesRequest.Builder().setKeys(Collections.singletonList(name)).build();
        BlockstoreData stored = Tasks.await(Blockstore.getClient(this).retrieveBytes(request), KEY_WAIT_SECONDS, TimeUnit.SECONDS)
            .getBlockstoreDataMap()
            .get(name);
        if (stored == null) return null;
        JSONObject vaulted = new JSONObject(new String(stored.getBytes(), StandardCharsets.UTF_8));
        return keyId.equals(vaulted.optString("keyId")) ? Base64.decode(vaulted.getString("pkcs8"), Base64.DEFAULT) : null;
    }

    // a group message's own key is sealed with the pair key, where a direct message is sealed with the pair key itself
    private static String plaintextOf(Map<String, String> data, byte[] pkcs8) throws GeneralSecurityException {
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

    // the push plugin hands any launch carrying a message id to the app's tap listener, which opens the chat
    private PendingIntent openChat(String messageId, String conversationId) {
        Intent intent = new Intent(this, MainActivity.class)
            .putExtra("google.message_id", messageId)
            .putExtra("conversationId", conversationId)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(this, conversationId.hashCode(), intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }
}
