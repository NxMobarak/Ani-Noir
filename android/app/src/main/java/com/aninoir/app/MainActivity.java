package com.aninoir.app;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Make status bar and nav bar transparent for immersive dark experience
        getWindow().setStatusBarColor(android.graphics.Color.parseColor("#07080f"));
        getWindow().setNavigationBarColor(android.graphics.Color.parseColor("#07080f"));

        // Keep screen awake during gameplay (optional, can remove)
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }
}
