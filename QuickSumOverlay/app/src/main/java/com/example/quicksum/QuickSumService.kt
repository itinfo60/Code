package com.example.quicksum

import android.accessibilityservice.AccessibilityService
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import java.math.BigDecimal

/** User-triggered addition, restricted to exposed PhonePe amount-entry field. No bypass. */
class QuickSumService : AccessibilityService() {
 private val target = "com.phonepe.app"
 private var wm: WindowManager? = null
 private var bar: View? = null
 private var total: BigDecimal? = null
 private var status: TextView? = null
 override fun onServiceConnected() {
  super.onServiceConnected()
  wm = getSystemService(WINDOW_SERVICE) as WindowManager
 }
 override fun onAccessibilityEvent(event: AccessibilityEvent?) {
  val root = rootInActiveWindow
  if (event?.packageName?.toString() != target || root?.packageName?.toString() != target || amountField(root) == null) {
   hide()
   if (event?.packageName?.toString() != target) total = null
   return
  }
  if (bar == null) show()
 }
 override fun onInterrupt() { hide() }
 override fun onDestroy() { hide(); super.onDestroy() }
 private fun contains(node: AccessibilityNodeInfo, phrase: String, depth: Int = 0): Boolean {
  if (depth > 22) return false
  if (listOfNotNull(node.text, node.hintText, node.contentDescription).any { it.toString().contains(phrase, true) }) return true
  for (i in 0 until node.childCount) {
   val child = node.getChild(i) ?: continue
   if (contains(child, phrase, depth + 1)) return true
  }
  return false
 }
 private fun edit(node: AccessibilityNodeInfo, depth: Int = 0): AccessibilityNodeInfo? {
  if (depth > 22) return null
  val strings = listOfNotNull(node.hintText, node.contentDescription, node.text)
  if (node.isEditable && node.isEnabled && !node.isPassword && strings.any { it.toString().contains("amount", true) }) return node
  for (i in 0 until node.childCount) {
   val child = node.getChild(i) ?: continue
   val found = edit(child, depth + 1)
   if (found != null) return found
  }
  return null
 }
 private fun amountField(root: AccessibilityNodeInfo): AccessibilityNodeInfo? {
  if (root.packageName?.toString() != target) return null
  if (!contains(root, "Enter amount") || !contains(root, "Proceed To Pay")) return null
  return edit(root)
 }
 private fun field(): AccessibilityNodeInfo? = rootInActiveWindow?.let { amountField(it) }
 private fun read(node: AccessibilityNodeInfo): BigDecimal? {
  val s = node.text?.toString()?.replace(",", "")?.replace("₹", "")?.trim() ?: return null
  if (!Regex("\\d{1,9}(\\.\\d{1,2})?").matches(s)) return null
  return try { BigDecimal(s) } catch (_: NumberFormatException) { null }
 }
 private fun write(node: AccessibilityNodeInfo, value: String): Boolean {
  if (!node.isEditable || node.isPassword || node.packageName?.toString() != target) return false
  if (node.actionList.none { it.id == AccessibilityNodeInfo.ACTION_SET_TEXT }) return false
  val args = Bundle().apply { putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, value) }
  return node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)
 }
 private fun pretty(n: BigDecimal) = n.stripTrailingZeros().toPlainString()
 private fun message(s: String) {
  status?.text = s
  if (bar == null) Toast.makeText(this, s, Toast.LENGTH_SHORT).show()
 }
 private fun plus() {
  val f = field() ?: return message("Amount unavailable")
  val n = read(f) ?: return message("Type an amount first")
  val next = (total ?: BigDecimal.ZERO).add(n)
  if (write(f, "")) { total = next; message("₹${pretty(next)} + …") }
  else message("Editing blocked")
 }
 private fun equalsAmount() {
  val prior = total ?: return message("Tap + first")
  val f = field() ?: return message("Amount unavailable")
  val n = read(f) ?: return message("Type next amount")
  val result = prior.add(n)
  if (write(f, pretty(result))) { total = null; message("= ₹${pretty(result)}") }
  else message("Editing blocked")
 }
 private fun dp(n: Int): Int = (n * resources.displayMetrics.density).toInt()
 private fun bg(color: Int) = GradientDrawable().apply {
  setColor(color); cornerRadius = dp(13).toFloat()
 }
 private fun show() {
  if (bar != null) return
  val container = LinearLayout(this).apply {
   gravity = Gravity.CENTER_VERTICAL
   orientation = LinearLayout.HORIZONTAL
   background = bg(Color.rgb(35, 36, 45))
   setPadding(dp(6), dp(5), dp(6), dp(5))
  }
  val handle = TextView(this).apply {
   text = "⋮⋮"; textSize = 21f; setTextColor(Color.WHITE)
   setPadding(dp(8), dp(6), dp(9), dp(6))
  }
  status = TextView(this).apply {
   text = total?.let { "₹${pretty(it)} + …" } ?: ""
   textSize = 12f; setTextColor(Color.WHITE)
   maxWidth = dp(88)
  }
  fun button(label: String, color: Int, action: () -> Unit) = TextView(this).apply {
   text = label; textSize = 26f; gravity = Gravity.CENTER
   setTextColor(Color.WHITE); background = bg(color)
   layoutParams = LinearLayout.LayoutParams(dp(48), dp(48)).apply { marginStart = dp(5) }
   setOnClickListener { action() }
  }
  container.addView(handle); container.addView(status)
  container.addView(button("+", Color.rgb(106, 53, 198)) { plus() })
  container.addView(button("=", Color.rgb(18, 128, 94)) { equalsAmount() })
  val p = WindowManager.LayoutParams(
   WindowManager.LayoutParams.WRAP_CONTENT, WindowManager.LayoutParams.WRAP_CONTENT,
   WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
   WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
   PixelFormat.TRANSLUCENT
  ).apply {
   gravity = Gravity.TOP or Gravity.END
   x = dp(12); y = (resources.displayMetrics.heightPixels * 0.38f).toInt()
  }
  handle.setOnTouchListener(object : View.OnTouchListener {
   var startX = 0; var startY = 0; var touchX = 0f; var touchY = 0f
   override fun onTouch(v: View?, e: MotionEvent): Boolean {
    when(e.actionMasked) {
     MotionEvent.ACTION_DOWN -> {
      startX=p.x; startY=p.y; touchX=e.rawX; touchY=e.rawY; return true
     }
     MotionEvent.ACTION_MOVE -> {
      p.x=(startX-(e.rawX-touchX)).toInt().coerceAtLeast(0)
      p.y=(startY+(e.rawY-touchY)).toInt().coerceAtLeast(0)
      try { wm?.updateViewLayout(container,p) } catch (_: Exception) {}
      return true
     }
    }
    return true
   }
  })
  try { wm?.addView(container,p); bar=container } catch (_: Exception) { status=null }
 }
 private fun hide() {
  bar?.let { try { wm?.removeView(it) } catch (_: Exception) {} }
  bar=null; status=null
 }
}