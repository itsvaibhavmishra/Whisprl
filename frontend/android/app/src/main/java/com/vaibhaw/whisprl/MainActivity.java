package com.vaibhaw.whisprl;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GoogleSignInPlugin.class);
        registerPlugin(KeyVaultPlugin.class);
        registerPlugin(PushSetupPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
