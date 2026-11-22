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
  val layout = LinearLayout(this).apply {
   orientation = LinearLayout.VERTICAL
   setPadding(40, 52, 40, 24)
   gravity = Gravity.CENTER_HORIZONTAL
  }
  layout.addView(TextView(this).apply {
   textSize = 18f
   text = "QuickSum Overlay\n\n1. Enable QuickSum amount helper under Accessibility settings.\n\n2. Open PhonePe QR payment amount screen. Type 28, tap +, type 56, tap =.\n\n3. Drag the floating handle to move buttons.\n\nThis works only if PhonePe exposes its amount field through Android Accessibility. It cannot bypass app restrictions and never clicks Pay or reads PINs.\n\nTurn off Accessibility after use."
  })
  layout.addView(Button(this).apply {
   text = "Open Accessibility Settings"
   setOnClickListener { startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) }
  })
  setContentView(layout)
 }
}