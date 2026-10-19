package com.vaibhaw.whisprl;

import android.os.CancellationSignal;
import androidx.core.content.ContextCompat;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.credentials.exceptions.GetCredentialException;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

// Google refuses its sign-in page inside a web view, so the app asks Android for the token and sends that to Whisprl instead
@CapacitorPlugin(name = "GoogleSignIn")
public class GoogleSignInPlugin extends Plugin {

    @PluginMethod
    public void signIn(PluginCall call) {
        GetSignInWithGoogleOption option = new GetSignInWithGoogleOption.Builder(call.getString("serverClientId")).build();
        GetCredentialRequest request = new GetCredentialRequest.Builder().addCredentialOption(option).build();
        CredentialManagerCallback<GetCredentialResponse, GetCredentialException> outcome = new CredentialManagerCallback<>() {
            @Override
            public void onResult(GetCredentialResponse response) {
                resolveToken(call, response.getCredential());
            }

            @Override
            public void onError(GetCredentialException error) {
                resolveOutcome(call, error instanceof GetCredentialCancellationException ? "cancelled" : "failed", null);
            }
        };
        getActivity()
            .runOnUiThread(() ->
                CredentialManager.create(getContext()).getCredentialAsync(
                    getActivity(),
                    request,
                    new CancellationSignal(),
                    ContextCompat.getMainExecutor(getContext()),
                    outcome
                )
            );
    }

    private void resolveToken(PluginCall call, Credential credential) {
        boolean isGoogleToken =
            credential instanceof CustomCredential && GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(credential.getType());
        if (!isGoogleToken) {
            resolveOutcome(call, "failed", null);
            return;
        }
        resolveOutcome(call, "signed-in", GoogleIdTokenCredential.createFrom(credential.getData()).getIdToken());
    }

    private void resolveOutcome(PluginCall call, String outcome, String idToken) {
        JSObject result = new JSObject();
        result.put("outcome", outcome);
        result.put("idToken", idToken);
        call.resolve(result);
    }
}
