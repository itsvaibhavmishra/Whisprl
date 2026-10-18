package com.vaibhaw.whisprl;

import android.app.KeyguardManager;
import android.content.Context;
import android.os.CancellationSignal;
import androidx.biometric.BiometricManager.Authenticators;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.credentials.CreateCredentialResponse;
import androidx.credentials.CreatePasswordRequest;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.exceptions.CreateCredentialCancellationException;
import androidx.credentials.exceptions.CreateCredentialException;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.blockstore.Blockstore;
import com.google.android.gms.auth.blockstore.BlockstoreClient;
import com.google.android.gms.auth.blockstore.DeleteBytesRequest;
import com.google.android.gms.auth.blockstore.RetrieveBytesRequest;
import com.google.android.gms.auth.blockstore.RetrieveBytesResponse.BlockstoreData;
import com.google.android.gms.auth.blockstore.StoreBytesData;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

// Block Store lives in Play services rather than the app, so with Google Backup on what it holds outlives a reinstall
@CapacitorPlugin(name = "KeyVault")
public class KeyVaultPlugin extends Plugin {

    private static final int OWNER_CHECK = Authenticators.BIOMETRIC_WEAK | Authenticators.DEVICE_CREDENTIAL;

    private BlockstoreClient blockstore() {
        return Blockstore.getClient(getContext());
    }

    @PluginMethod
    public void save(PluginCall call) {
        String name = call.getString("name");
        byte[] value = call.getString("value").getBytes(StandardCharsets.UTF_8);
        blockstore()
            .isEndToEndEncryptionAvailable()
            .addOnSuccessListener(isEncrypted -> {
                StoreBytesData data = new StoreBytesData.Builder()
                    .setKey(name)
                    .setBytes(value)
                    // a copy leaves the phone only when nobody but the owner's screen lock can open it
                    .setShouldBackupToCloud(isEncrypted)
                    .build();
                blockstore()
                    .storeBytes(data)
                    .addOnSuccessListener(stored -> call.resolve())
                    .addOnFailureListener(error -> call.reject(error.getMessage()));
            })
            .addOnFailureListener(error -> call.reject(error.getMessage()));
    }

    @PluginMethod
    public void load(PluginCall call) {
        String name = call.getString("name");
        RetrieveBytesRequest request = new RetrieveBytesRequest.Builder().setKeys(Collections.singletonList(name)).build();
        blockstore()
            .retrieveBytes(request)
            .addOnSuccessListener(response -> {
                BlockstoreData data = response.getBlockstoreDataMap().get(name);
                JSObject result = new JSObject();
                if (data != null) result.put("value", new String(data.getBytes(), StandardCharsets.UTF_8));
                call.resolve(result);
            })
            .addOnFailureListener(error -> call.reject(error.getMessage()));
    }

    @PluginMethod
    public void remove(PluginCall call) {
        DeleteBytesRequest request = new DeleteBytesRequest.Builder().setKeys(Collections.singletonList(call.getString("name"))).build();
        blockstore()
            .deleteBytes(request)
            .addOnSuccessListener(deleted -> call.resolve())
            .addOnFailureListener(error -> call.reject(error.getMessage()));
    }

    @PluginMethod
    public void confirmOwner(PluginCall call) {
        KeyguardManager keyguard = (KeyguardManager) getContext().getSystemService(Context.KEYGUARD_SERVICE);
        // a phone with no screen lock has nothing to check against
        if (!keyguard.isDeviceSecure()) {
            resolveConfirmed(call, true);
            return;
        }

        BiometricPrompt.PromptInfo prompt = new BiometricPrompt.PromptInfo.Builder()
            .setTitle(call.getString("title"))
            .setSubtitle(call.getString("subtitle"))
            .setAllowedAuthenticators(OWNER_CHECK)
            .build();
        BiometricPrompt.AuthenticationCallback outcome = new BiometricPrompt.AuthenticationCallback() {
            @Override
            public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                resolveConfirmed(call, true);
            }

            @Override
            public void onAuthenticationError(int code, CharSequence message) {
                resolveConfirmed(call, false);
            }
        };
        getActivity().runOnUiThread(() -> new BiometricPrompt(getActivity(), ContextCompat.getMainExecutor(getContext()), outcome).authenticate(prompt));
    }

    @PluginMethod
    public void savePassword(PluginCall call) {
        CreatePasswordRequest request = new CreatePasswordRequest(call.getString("id"), call.getString("password"));
        CredentialManagerCallback<CreateCredentialResponse, CreateCredentialException> outcome = new CredentialManagerCallback<>() {
            @Override
            public void onResult(CreateCredentialResponse response) {
                resolveSaved(call, "saved");
            }

            @Override
            public void onError(CreateCredentialException error) {
                resolveSaved(call, error instanceof CreateCredentialCancellationException ? "cancelled" : "failed");
            }
        };
        getActivity()
            .runOnUiThread(() ->
                CredentialManager.create(getContext()).createCredentialAsync(
                    getActivity(),
                    request,
                    new CancellationSignal(),
                    ContextCompat.getMainExecutor(getContext()),
                    outcome
                )
            );
    }

    private void resolveSaved(PluginCall call, String outcome) {
        JSObject result = new JSObject();
        result.put("outcome", outcome);
        call.resolve(result);
    }

    private void resolveConfirmed(PluginCall call, boolean isConfirmed) {
        JSObject result = new JSObject();
        result.put("confirmed", isConfirmed);
        call.resolve(result);
    }
}
