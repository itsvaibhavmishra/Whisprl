package com.vaibhaw.whisprl;

import org.json.JSONException;
import org.json.JSONObject;

// the wording of summaryOf in messageSummary.js on the web, for what one message says on its own
final class MessageSummary {

    private static final String STRUCTURED = "\u0001";

    private MessageSummary() {}

    static String of(String plaintext, String kind) throws JSONException {
        if (kind.equals("text")) return ofText(plaintext);

        JSONObject content = new JSONObject(plaintext);
        JSONObject file = content.optJSONObject("file");
        String fileKind = file == null ? "" : textOf(file, "kind");
        if (kind.equals("view-once")) return fileKind.equals("video") ? "View once video" : "View once photo";

        String caption = textOf(content, "caption");
        if (!caption.isEmpty()) return caption;
        switch (fileKind) {
            case "image":
                return "Photo";
            case "video":
                return "Video";
            case "voice":
                return "Voice message";
            default:
                return file == null ? "" : textOf(file, "name");
        }
    }

    private static String ofText(String plaintext) throws JSONException {
        if (!plaintext.startsWith(STRUCTURED)) return plaintext;

        JSONObject payload = new JSONObject(plaintext.substring(STRUCTURED.length()));
        JSONObject contact = payload.optJSONObject("contact");
        if (contact != null) return "Contact: " + textOf(contact, "firstName") + " " + textOf(contact, "lastName");

        String text = textOf(payload, "text");
        JSONObject statusQuote = payload.optJSONObject("statusQuote");
        if (statusQuote == null || !text.isEmpty()) return text;
        switch (textOf(statusQuote, "about")) {
            case "mention":
                return "Mentioned in a status";
            case "share":
                return "Shared a status";
            default:
                return "Replied to a status";
        }
    }

    // org.json reads a JSON null as the word "null", where a missing value should read as nothing
    private static String textOf(JSONObject json, String name) {
        return json.isNull(name) ? "" : json.optString(name);
    }
}
