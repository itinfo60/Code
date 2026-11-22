package com.example.quicksum

import android.app.Activity
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import java.math.BigDecimal

/**
 * Permission-free, local calculator.
 * Does not inspect, overlay, or modify other apps, including payment apps.
 */
class MainActivity : Activity() {
    private var total = BigDecimal.ZERO
    private var pending = false
    private lateinit var amount: EditText
    private lateinit var saved: TextView
    private lateinit var result: TextView
    private lateinit var copyButton: Button

    private fun dp(x: Int) = (x * resources.displayMetrics.density).toInt()
    private fun shape(color: Int, radius: Int = 16): GradientDrawable =
        GradientDrawable().apply { setColor(color); cornerRadius = dp(radius).toFloat() }

    private fun pretty(number: BigDecimal) = number.stripTrailingZeros().toPlainString()
    private fun parse(): BigDecimal? {
        val value = amount.text.toString().trim()
        if (!Regex("\\d{1,9}(\\.\\d{1,2})?").matches(value)) return null
        return try { BigDecimal(value) } catch (_: NumberFormatException) { null }
    }
    private fun feedback(message: String) =
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()

    private fun add() {
        val n = parse() ?: return feedback("Enter a valid amount, e.g. 28 or 28.50")
        total = total.add(n)
        pending = true
        saved.text = "Saved: ₹${pretty(total)} + …"
        result.text = "₹${pretty(total)}"
        copyButton.isEnabled = false
        amount.text.clear()
        amount.requestFocus()
    }

    private fun equalsAmount() {
        val n = parse()
        if (n == null) {
            if (!pending) return feedback("Type an amount first")
            return feedback("Enter the next amount")
        }
        val finalValue = if (pending) total.add(n) else n
        total = BigDecimal.ZERO
        pending = false
        val text = pretty(finalValue)
        result.text = "₹$text"
        saved.text = "Result ready — copy it into PhonePe manually"
        amount.setText(text)
        amount.setSelection(amount.text.length)
        copyButton.isEnabled = true
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val scroller = ScrollView(this)
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(24), dp(32), dp(24), dp(24))
            setBackgroundColor(Color.rgb(248, 249, 252))
        }
        scroller.addView(root)
        fun text(label: String, size: Float, color: Int, bold: Boolean = false): TextView {
            return TextView(this).apply {
                this.text = label
                textSize = size
                setTextColor(color)
                if (bold) setTypeface(null, Typeface.BOLD)
            }
        }
        val dark = Color.rgb(31, 35, 54)
        val purple = Color.rgb(98, 55, 196)
        root.addView(text("QuickSum", 30f, dark, true))
        root.addView(text("Safe calculator for QR payments", 15f, Color.DKGRAY).apply {
            setPadding(0, dp(5), 0, dp(24))
        })
        root.addView(text("Enter amount", 15f, dark, true))
        amount = EditText(this).apply {
            hint = "Example: 28"
            textSize = 28f
            setSingleLine(true)
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_FLAG_DECIMAL
            setPadding(dp(16), dp(10), dp(16), dp(10))
            background = shape(Color.WHITE, 12)
            setTextColor(dark)
        }
        root.addView(amount, LinearLayout.LayoutParams(-1, dp(64)).apply {
            topMargin = dp(10); bottomMargin = dp(18)
        })
        val buttons = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        fun action(label: String, color: Int, click: () -> Unit): Button {
            return Button(this).apply {
                text = label
                textSize = 24f
                isAllCaps = false
                backgroundTintList = ColorStateList.valueOf(color)
                setTextColor(Color.WHITE)
                setOnClickListener { click() }
            }
        }
        buttons.addView(action("+", purple) { add() }, LinearLayout.LayoutParams(0, dp(64), 1f))
        buttons.addView(action("=", Color.rgb(15, 133, 91)) { equalsAmount() },
            LinearLayout.LayoutParams(0, dp(64), 1f).apply { marginStart = dp(12) })
        root.addView(buttons)

        saved = text("Enter 28, tap +, enter 56, tap =", 15f, Color.DKGRAY)
        root.addView(saved.apply { setPadding(0, dp(26), 0, dp(14)) })
        result = text("₹0", 38f, dark, true)
        root.addView(result)

        copyButton = action("Copy result", purple) {
            val value = amount.text.toString()
            if (value.isEmpty()) return@action
            val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            clipboard.setPrimaryClip(ClipData.newPlainText("QuickSum amount", value))
            feedback("Amount copied. Paste into PhonePe's amount field.")
        }.apply { isEnabled = false; textSize = 17f }
        root.addView(copyButton, LinearLayout.LayoutParams(-1, dp(60)).apply {
            topMargin = dp(18)
        })
        root.addView(action("Clear", Color.rgb(106, 112, 126)) {
            total = BigDecimal.ZERO
            pending = false
            amount.text.clear()
            saved.text = "Enter 28, tap +, enter 56, tap ="
            result.text = "₹0"
            copyButton.isEnabled = false
        }.apply { textSize = 16f }, LinearLayout.LayoutParams(-1, dp(54)).apply {
            topMargin = dp(12)
        })
        root.addView(text(
            "Payment safety: This app cannot access your PhonePe screen, read passwords, use Accessibility, or enter amounts automatically. Paste and verify the total before paying. You can use Android split-screen where supported.",
            13f, Color.DKGRAY
        ).apply { setPadding(0, dp(26), 0, dp(12)) })
        setContentView(scroller)
    }
}
