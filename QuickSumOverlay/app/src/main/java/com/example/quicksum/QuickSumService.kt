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
import android.widget.HorizontalScrollView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import java.math.BigDecimal
import java.math.MathContext
import java.math.RoundingMode

/**
 * User-consented, on-device prototype. No external network, no background payment action.
 * Only attempts to read/edit the plain amount field when exposed by PhonePe Accessibility.
 * Does not bypass Android, PhonePe, or Play Protect restrictions.
 */
class QuickSumService : AccessibilityService() {
    private val target = "com.phonepe.app"
    private val context = MathContext.DECIMAL64
    private var wm: WindowManager? = null
    private var overlay: View? = null
    private var expression: TextView? = null
    private var scroll: HorizontalScrollView? = null
    private var layout: WindowManager.LayoutParams? = null

    private val tokens = mutableListOf<String>() // alternating committed operands/operators
    private var entry = ""
    private var lastWritten: String? = null
    private var programmaticUpdate = false
    private var paymentFieldSeen = false
    private var actionRunning = false
    private var latestError: String? = null

    override fun onServiceConnected() {
        super.onServiceConnected()
        wm = getSystemService(WINDOW_SERVICE) as WindowManager
    }
    override fun onInterrupt() { hide() }
    override fun onDestroy() { hide(); super.onDestroy() }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        // Gboard and accessibility-overlay windows generate events too. Ignore them;
        // hiding/resetting here makes buttons appear to miss taps intermittently.
        if (event.packageName?.toString() != target) return
        val field = field()
        if (field == null) {
            // Only dismiss on target-app window transitions, not transient text updates.
            if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
                hide()
                paymentFieldSeen = false
                reset()
            }
            return
        }
        paymentFieldSeen = true
        if (overlay == null) show()
        // Ignore the text event created by our own ACTION_SET_TEXT.
        if (event.eventType != AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED || programmaticUpdate) return
        val raw = clean(field.text?.toString() ?: "") ?: return
        if (raw == lastWritten) return
        acceptExternalChange(raw, field)
    }

    private fun seek(node: AccessibilityNodeInfo, phrase: String, depth: Int = 0): Boolean {
        if (depth > 28) return false
        if (listOfNotNull(node.text, node.hintText, node.contentDescription)
                .any { it.toString().contains(phrase, true) }) return true
        for (i in 0 until node.childCount) {
            node.getChild(i)?.let { if (seek(it, phrase, depth + 1)) return true }
        }
        return false
    }
    private fun findAmount(node: AccessibilityNodeInfo, depth: Int = 0): AccessibilityNodeInfo? {
        if (depth > 28) return null
        if (node.isEditable && node.isEnabled && !node.isPassword &&
            listOfNotNull(node.hintText, node.contentDescription, node.text)
                .any { it.toString().contains("amount", true) }) return node
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            val match = findAmount(child, depth + 1)
            if (match != null) return match
        }
        return null
    }
    private fun field(): AccessibilityNodeInfo? {
        val root = rootInActiveWindow ?: return null
        if (root.packageName?.toString() != target) return null
        // Avoid PIN, confirmation, and other screens: require both visible anchors.
        if (!seek(root, "Enter amount") || !seek(root, "Proceed To Pay")) return null
        return findAmount(root)
    }

    private fun clean(raw: String): String? {
        val n = raw.replace(",", "").replace("₹", "").trim()
        if (n.isEmpty()) return ""
        return if (Regex("-?\\d{1,9}(\\.\\d{0,2})?").matches(n)) n else null
    }
    private fun validOperand(s: String) =
        s.matches(Regex("\\d{1,9}(\\.\\d{1,2})?"))
    private fun pretty(n: BigDecimal) = n.stripTrailingZeros().toPlainString()
    private fun isOperator(s: String) = s in setOf("+", "−", "×", "÷")

    private fun evaluate(values: List<String>): BigDecimal? {
        if (values.isEmpty() || !validOperand(values[0])) return null
        val work = mutableListOf<Any>(BigDecimal(values[0]))
        var i = 1
        try {
            while (i + 1 < values.size) {
                val operator = values[i]
                val number = BigDecimal(values[i + 1])
                when (operator) {
                    "×", "÷" -> {
                        val previous = work.removeAt(work.lastIndex) as BigDecimal
                        if (operator == "÷" && number.compareTo(BigDecimal.ZERO) == 0) {
                            latestError = "Division by zero"
                            return null
                        }
                        work.add(if (operator == "×") previous.multiply(number, context)
                                 else previous.divide(number, context))
                    }
                    "+", "−" -> {
                        work.add(operator)
                        work.add(number)
                    }
                    else -> return null
                }
                i += 2
            }
            var total = work[0] as BigDecimal
            i = 1
            while (i + 1 < work.size) {
                val operator = work[i] as String
                val number = work[i + 1] as BigDecimal
                total = if (operator == "+") total.add(number, context)
                        else total.subtract(number, context)
                i += 2
            }
            return total.setScale(2, RoundingMode.HALF_UP).stripTrailingZeros()
        } catch (_: Exception) {
            latestError = "Invalid calculation"
            return null
        }
    }
    private fun currentTokens(): List<String> {
        val out = tokens.toMutableList()
        if (entry.isNotEmpty() && validOperand(entry)) out.add(entry)
        if (out.lastOrNull()?.let(::isOperator) == true) out.removeAt(out.lastIndex)
        return out
    }
    private fun calculate(): String? {
        latestError = null
        return evaluate(currentTokens())?.let(::pretty)
    }
    private fun canWrite(field: AccessibilityNodeInfo, amount: String): Boolean {
        if (field.packageName?.toString() != target || !field.isEditable || field.isPassword) return false
        if (field.actionList.none { it.id == AccessibilityNodeInfo.ACTION_SET_TEXT }) return false
        if (amount.isNotEmpty() && !Regex("\\d{1,9}(\\.\\d{0,2})?").matches(amount)) return false
        return true
    }
    private fun write(field: AccessibilityNodeInfo, value: String): Boolean {
        if (!canWrite(field, value)) return false
        val bundle = Bundle().apply {
            putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, value)
        }
        programmaticUpdate = true
        val ok = try { field.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, bundle) }
                 catch (_: Exception) { false }
        programmaticUpdate = false
        if (ok) lastWritten = value
        return ok
    }
    private fun notifyUser(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
    private fun sync(field: AccessibilityNodeInfo? = field()) {
        redraw()
        val total = calculate() ?: return
        // An amount field generally accepts only positive values. Do not write negative or zero.
        val numeric = total.toBigDecimalOrNull() ?: return
        if (numeric <= BigDecimal.ZERO || numeric > BigDecimal("999999999")) return
        if (field == null || !write(field, total)) notifyUser("PhonePe did not allow changing the amount")
    }

    /**
     * When the field shows our rendered total, Gboard may append or replace digits.
     * We recover the newly typed digits only when the change is unambiguous.
     * Ambiguous edits are rejected instead of guessing a payment amount.
     */
    private fun acceptExternalChange(raw: String, field: AccessibilityNodeInfo) {
        val prior = lastWritten
        if (tokens.isEmpty()) {
            if (validOperand(raw)) {
                entry = raw
                lastWritten = null
                redraw()
            } else if (raw.isEmpty()) {
                entry = ""
                redraw()
            }
            return
        }
        if (prior == null) return
        // Gboard's own delete key removes a character from the displayed amount.
        // Translate that explicit one-character deletion into an expression edit.
        if (raw == prior.dropLast(1) && raw.length < prior.length) {
            eraseExpressionDigit(field)
            return
        }
        if (raw.startsWith(prior) && raw.length > prior.length) {
            val delta = raw.substring(prior.length)
            if (!Regex("\\d{1,9}(\\.\\d{0,2})?").matches(delta)) return
            entry += delta
            sync(field)
            return
        }
        // Sometimes the IME replaces the entire field with the next operand.
        if (validOperand(raw) && raw != prior && entry.isEmpty()) {
            entry = raw
            sync(field)
            return
        }
        // Never guess when edits to the computed total are ambiguous.
        if (raw != prior) notifyUser("Use C to restart after editing the result")
    }
    private fun op(symbol: String) {
        val f = field() ?: return notifyUser("PhonePe amount field unavailable")
        if (tokens.isEmpty()) {
            val number = if (entry.isNotEmpty()) entry else clean(f.text?.toString() ?: "")
            if (number == null || !validOperand(number)) return notifyUser("Type an amount first")
            tokens.add(number)
            tokens.add(symbol)
            entry = ""
        } else if (entry.isNotEmpty()) {
            if (!validOperand(entry)) return notifyUser("Invalid amount")
            tokens.add(entry)
            tokens.add(symbol)
            entry = ""
        } else if (tokens.lastOrNull()?.let(::isOperator) == true) {
            tokens[tokens.lastIndex] = symbol
        } else {
            tokens.add(symbol)
        }
        sync(f)
    }
    private fun eraseExpressionDigit(f: AccessibilityNodeInfo) {
        when {
            entry.isNotEmpty() -> entry = entry.dropLast(1)
            tokens.lastOrNull()?.let(::isOperator) == true -> {
                tokens.removeAt(tokens.lastIndex)
                if (tokens.isNotEmpty()) entry = tokens.removeAt(tokens.lastIndex).dropLast(1)
            }
            tokens.isNotEmpty() -> entry = tokens.removeAt(tokens.lastIndex).dropLast(1)
        }
        if (tokens.isEmpty() && entry.isEmpty()) {
            reset()
            write(f, "")
            redraw()
        } else sync(f)
    }
    private fun clearAll() {
        reset()
        field()?.let { write(it, "") }
        redraw()
    }
    private fun reset() {
        tokens.clear()
        entry = ""
        lastWritten = null
        latestError = null
    }
    private fun redraw() {
        val joined = (tokens + listOfNotNull(entry.takeIf { it.isNotEmpty() }))
            .joinToString(" ")
        expression?.text = joined.ifEmpty { "Enter amount using Gboard" }
        scroll?.post { scroll?.fullScroll(View.FOCUS_RIGHT) }
    }
    private fun dp(n: Int) = (resources.displayMetrics.density * n).toInt()
    private fun bg(c: Int, radius: Int): GradientDrawable = GradientDrawable().apply {
        setColor(c); cornerRadius = dp(radius).toFloat()
    }

    private fun show() {
        if (overlay != null) return
        val bgColor = Color.rgb(30, 32, 39)
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(7), dp(7), dp(7), dp(7))
            background = bg(Color.rgb(18, 18, 20), 14)
        }
        scroll = HorizontalScrollView(this).apply {
            isHorizontalScrollBarEnabled = false
            isFillViewport = true
            background = bg(bgColor, 12)
        }
        expression = TextView(this).apply {
            textSize = 18f
            setTextColor(Color.rgb(242, 243, 246))
            isSingleLine = true
            ellipsize = null
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(12), 0, dp(12), 0)
        }
        scroll!!.addView(expression)
        root.addView(scroll, LinearLayout.LayoutParams(-1, dp(53)).apply {
            bottomMargin = dp(12)
        })
        val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        fun makeButton(s: String, color: Int, fn: () -> Unit) {
            val btn = TextView(this).apply {
                text = s
                textSize = 23f
                setTextColor(color)
                gravity = Gravity.CENTER
                background = bg(Color.rgb(43, 45, 52), 15)
                isClickable = true
                isFocusable = false
                setOnClickListener {
                    // Serialize taps; never enqueue overlapping edits while PhonePe updates.
                    if (actionRunning) return@setOnClickListener
                    actionRunning = true
                    try { fn() } finally { actionRunning = false }
                }
            }
            row.addView(btn, LinearLayout.LayoutParams(0, dp(55), 1f).apply {
                marginStart = dp(2); marginEnd = dp(2)
            })
        }
        makeButton("C", Color.rgb(234, 119, 122)) { clearAll() }
        makeButton("÷", Color.WHITE) { op("÷") }
        makeButton("×", Color.WHITE) { op("×") }
        makeButton("−", Color.WHITE) { op("−") }
        makeButton("+", Color.rgb(137, 230, 187)) { op("+") }
        root.addView(row)
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            y = dp(190)
        }
        // Drag the expression strip (not the buttons) to reposition the panel.
        var startY = 0
        var touchedY = 0f
        expression!!.setOnTouchListener(object : View.OnTouchListener {
            override fun onTouch(v: View?, ev: MotionEvent): Boolean {
                when (ev.actionMasked) {
                    MotionEvent.ACTION_DOWN -> {
                        startY = params.y
                        touchedY = ev.rawY
                        return true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        params.y = (startY + (ev.rawY - touchedY).toInt())
                            .coerceIn(dp(30), resources.displayMetrics.heightPixels - dp(140))
                        try { wm?.updateViewLayout(root, params) } catch (_: Exception) {}
                        return true
                    }
                }
                return true
            }
        })
        try {
            wm?.addView(root, params)
            overlay = root
            layout = params
            redraw()
        } catch (_: Exception) {
            overlay = null
            expression = null
            scroll = null
        }
    }
    private fun hide() {
        overlay?.let { try { wm?.removeView(it) } catch (_: Exception) {} }
        overlay = null
        expression = null
        scroll = null
        layout = null
    }
}
