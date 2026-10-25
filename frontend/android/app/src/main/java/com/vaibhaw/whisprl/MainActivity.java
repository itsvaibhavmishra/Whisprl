package com.vaibhaw.whisprl;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ArrivedMessagesPlugin.class);
        registerPlugin(BackGesturePlugin.class);
        registerPlugin(FileSaverPlugin.class);
        registerPlugin(GoogleSignInPlugin.class);
        registerPlugin(HapticsPlugin.class);
        registerPlugin(KeyVaultPlugin.class);
        registerPlugin(PushSetupPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
