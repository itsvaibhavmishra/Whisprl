package com.vaibhaw.whisprl;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import androidx.annotation.RequiresApi;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

// photos and videos go where the gallery finds them, and documents to Downloads, each in a Whisprl folder
@CapacitorPlugin(name = "FileSaver", permissions = @Permission(alias = "storage", strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE }))
public class FileSaverPlugin extends Plugin {

    private static final String APP_FOLDER = "Whisprl";
    private static final boolean HAS_MEDIA_STORE_FOLDERS = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q;

    private static String folderFor(String kind, String mimeType) {
        if ("document".equals(kind)) return Environment.DIRECTORY_DOWNLOADS;
        if (mimeType.startsWith("image/")) return Environment.DIRECTORY_PICTURES;
        if (mimeType.startsWith("video/")) return Environment.DIRECTORY_MOVIES;
        return Environment.DIRECTORY_DOWNLOADS;
    }

    @RequiresApi(Build.VERSION_CODES.Q)
    private static Uri collectionFor(String folder) {
        if (folder.equals(Environment.DIRECTORY_PICTURES)) return MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
        if (folder.equals(Environment.DIRECTORY_MOVIES)) return MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
        return MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
    }

    @PluginMethod
    public void save(PluginCall call) {
        if (!HAS_MEDIA_STORE_FOLDERS && getPermissionState("storage") != PermissionState.GRANTED) {
            requestPermissionForAlias("storage", call, "storageAnswered");
            return;
        }
        write(call);
    }

    @PermissionCallback
    private void storageAnswered(PluginCall call) {
        if (getPermissionState("storage") == PermissionState.GRANTED) write(call);
        else call.reject("Storage permission was refused");
    }

    private void write(PluginCall call) {
        String fileName = call.getString("fileName", "file");
        String mimeType = call.getString("mimeType", "application/octet-stream");
        String folder = folderFor(call.getString("kind", "media"), mimeType);
        try {
            byte[] bytes = Base64.decode(call.getString("data", ""), Base64.DEFAULT);
            if (HAS_MEDIA_STORE_FOLDERS) writeToMediaStore(bytes, fileName, mimeType, folder);
            else writeToFolder(bytes, fileName, mimeType, folder);
            JSObject saved = new JSObject();
            saved.put("folder", folder);
            call.resolve(saved);
        } catch (IOException | IllegalArgumentException error) {
            call.reject("The file could not be saved", error);
        }
    }

    // a file stays hidden while it is written, so the gallery never shows half of one
    @RequiresApi(Build.VERSION_CODES.Q)
    private void writeToMediaStore(byte[] bytes, String fileName, String mimeType, String folder) throws IOException {
        ContentResolver resolver = getContext().getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
        values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
        values.put(MediaStore.MediaColumns.RELATIVE_PATH, folder + "/" + APP_FOLDER);
        values.put(MediaStore.MediaColumns.IS_PENDING, 1);
        Uri saved = resolver.insert(collectionFor(folder), values);
        if (saved == null) throw new IOException("No place to save the file");

        try (OutputStream output = resolver.openOutputStream(saved)) {
            if (output == null) throw new IOException("The saved file could not be opened");
            output.write(bytes);
        } catch (IOException error) {
            resolver.delete(saved, null, null);
            throw error;
        }
        ContentValues finished = new ContentValues();
        finished.put(MediaStore.MediaColumns.IS_PENDING, 0);
        resolver.update(saved, finished, null, null);
    }

    private void writeToFolder(byte[] bytes, String fileName, String mimeType, String folder) throws IOException {
        File directory = new File(Environment.getExternalStoragePublicDirectory(folder), APP_FOLDER);
        if (!directory.isDirectory() && !directory.mkdirs()) throw new IOException("The Whisprl folder could not be made");
        File target = freeFileIn(directory, fileName);
        try (OutputStream output = new FileOutputStream(target)) {
            output.write(bytes);
        }
        MediaScannerConnection.scanFile(getContext(), new String[] { target.getAbsolutePath() }, new String[] { mimeType }, null);
    }

    // the media store numbers a repeated name itself, so only the older folders need it done here
    private static File freeFileIn(File directory, String fileName) {
        int dot = fileName.lastIndexOf('.');
        String stem = dot > 0 ? fileName.substring(0, dot) : fileName;
        String extension = dot > 0 ? fileName.substring(dot) : "";
        File candidate = new File(directory, fileName);
        for (int copy = 1; candidate.exists(); copy++) candidate = new File(directory, stem + " (" + copy + ")" + extension);
        return candidate;
    }
}
