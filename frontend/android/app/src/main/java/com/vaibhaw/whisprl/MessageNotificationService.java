package com.vaibhaw.whisprl;

import android.app.ActivityManager;
import android.app.PendingIntent;
import android.content.Intent;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationChannelCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import com.capacitorjs.plugins.pushnotifications.MessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

// the server cannot read a message, so it sends the ciphertext and the phone opens it to say what was written
public class MessageNotificationService extends MessagingService {

    private static final String CHANNEL_ID = "messages";
    private static final String FALLBACK_TEXT = "New message";

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        Map<String, String> data = remoteMessage.getData();
        if (!data.containsKey("conversationId")) return;
        // a photo or video is still uploading when its push is sent, so only text is ready to show at the next launch
        if ("text".equals(data.get("kind"))) ArrivedMessages.keep(this, data);
        if (!isOnScreen()) show(remoteMessage.getMessageId(), data);
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
            String plaintext = SealedMessage.plaintextOf(data, SealedMessage.vaultedKeyOf(this, data.get("recipientId")));
            if (plaintext == null) return FALLBACK_TEXT;
            String summary = MessageSummary.of(plaintext, data.get("kind"));
            return summary.isEmpty() ? FALLBACK_TEXT : summary;
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            return FALLBACK_TEXT;
        } catch (Exception error) {
            return FALLBACK_TEXT;
        }
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
