package com.example.quicksum

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(36, 56, 36, 32)
        }
        root.addView(TextView(this).apply {
            textSize = 20f
            text = "QuickSum Floating — Experimental v0.3"
        })
        root.addView(TextView(this).apply {
            textSize = 16f
            setPadding(0, 24, 0, 24)
            text = "Before enabling, please read:\n\n" +
                "QuickSum requests sensitive Android Accessibility access to detect PhonePe's amount field, " +
                "read its amount, and attempt to replace it with your running calculation. " +
                "A floating bar displays C, backspace, ÷, ×, − and +. " +
                "It does not read PINs or OTPs, use the internet, collect data, or tap Pay.\n\n" +
                "This may be blocked by Google Play Protect or PhonePe. Do not bypass those restrictions. " +
                "Enable this feature only if Android permits it. Turn the service off when not in use.\n\n" +
                "This is an unverified prototype: check the final amount before paying."
        })
        root.addView(Button(this).apply {
            text = "Open Accessibility Settings"
            setOnClickListener { startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) }
        })
        setContentView(root)
    }
}