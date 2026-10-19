package com.vaibhaw.whisprl;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class MessageSummaryTest {

    @Test
    public void plainTextReadsAsItIs() throws Exception {
        assertEquals("meet at 6? 🐱", MessageSummary.of("meet at 6? 🐱", "text"));
    }

    @Test
    public void aSharedContactNamesThePerson() throws Exception {
        assertEquals("Contact: Sarah Miller", MessageSummary.of("\u0001{\"text\":\"\",\"contact\":{\"firstName\":\"Sarah\",\"lastName\":\"Miller\"}}", "text"));
    }

    @Test
    public void aStatusReplyWithoutWordsSaysWhatItIs() throws Exception {
        assertEquals("Mentioned in a status", MessageSummary.of("\u0001{\"text\":\"\",\"statusQuote\":{\"about\":\"mention\"}}", "text"));
    }

    @Test
    public void aFileShowsItsCaptionElseItsKind() throws Exception {
        assertEquals("look at this", MessageSummary.of("{\"caption\":\"look at this\",\"file\":{\"kind\":\"image\"}}", "file"));
        assertEquals("Photo", MessageSummary.of("{\"file\":{\"kind\":\"image\"}}", "file"));
        assertEquals("Voice message", MessageSummary.of("{\"caption\":null,\"file\":{\"kind\":\"voice\"}}", "file"));
        assertEquals("notes.pdf", MessageSummary.of("{\"file\":{\"kind\":\"document\",\"name\":\"notes.pdf\"}}", "file"));
    }

    @Test
    public void aViewOnceMessageNeverShowsItsCaption() throws Exception {
        assertEquals("View once video", MessageSummary.of("{\"caption\":\"secret\",\"file\":{\"kind\":\"video\"}}", "view-once"));
    }
}
