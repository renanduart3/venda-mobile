package com.renanduart3.vendamobile.scanner

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Size
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.view.WindowInsets
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.AnimationUtils
import android.view.animation.TranslateAnimation
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.BarcodeScanner
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class BarcodeScannerActivity : ComponentActivity() {
  private lateinit var cameraExecutor: ExecutorService
  private lateinit var barcodeScanner: BarcodeScanner
  private var cameraProvider: ProcessCameraProvider? = null
  private var isLocked = false
  private var detectedCode: String? = null

  // UI refs
  private var statusPill: TextView? = null
  private var popupContainer: FrameLayout? = null
  private var productNameText: TextView? = null
  private var barcodeText: TextView? = null
  private var quantityText: TextView? = null
  private var cartCountBadge: TextView? = null
  private var cartBtnWrapper: FrameLayout? = null
  private var currentQuantity = 1
  private var isNotFound = false

  // Multi-item session: accumulated scanned items
  data class ScannedItem(val barcode: String, val quantity: Int, val notFound: Boolean)
  private val scannedItems = mutableListOf<ScannedItem>()

  // Products lookup: barcode -> name
  private val productMap = mutableMapOf<String, String>()

  // Mode: "sale" (multi-item) or "single" (product registration)
  private var isSaleMode = false

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    requestWindowFeature(Window.FEATURE_NO_TITLE)
    window.statusBarColor = Color.TRANSPARENT
    window.decorView.systemUiVisibility = (
      View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
      View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
    )

    cameraExecutor = Executors.newSingleThreadExecutor()
    barcodeScanner = BarcodeScanning.getClient(
      BarcodeScannerOptions.Builder()
        .setBarcodeFormats(
          Barcode.FORMAT_EAN_13,
          Barcode.FORMAT_EAN_8,
          Barcode.FORMAT_CODE_128,
          Barcode.FORMAT_UPC_A,
          Barcode.FORMAT_UPC_E,
          Barcode.FORMAT_QR_CODE
        )
        .build()
    )

    // Parse products JSON passed from React Native
    val productsJson = intent.getStringExtra(EXTRA_PRODUCTS_JSON)
    if (!productsJson.isNullOrBlank()) {
      isSaleMode = true
      try {
        val arr = JSONArray(productsJson)
        for (i in 0 until arr.length()) {
          val obj = arr.getJSONObject(i)
          val barcode = obj.optString("barcode", "").trim()
          val name = obj.optString("name", "").trim()
          if (barcode.isNotEmpty() && name.isNotEmpty()) {
            productMap[barcode] = name
          }
        }
      } catch (_: Exception) {}
    } else {
      isSaleMode = false
    }

    if (hasCameraPermission()) {
      buildUI()
    } else {
      showPermissionRequest()
    }
  }

  private fun hasCameraPermission(): Boolean =
    ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) ==
      PackageManager.PERMISSION_GRANTED

  private fun showPermissionRequest() {
    val container = FrameLayout(this).apply {
      setBackgroundColor(Color.rgb(15, 23, 42))
      layoutParams = ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT
      )
    }

    val col = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setPadding(dp(32), dp(32), dp(32), dp(32))
    }

    val icon = TextView(this).apply {
      text = "📷"
      textSize = 48f
      gravity = Gravity.CENTER
    }
    col.addView(icon, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    ).apply { bottomMargin = dp(16) })

    val title = TextView(this).apply {
      text = "Câmera necessária"
      setTextColor(Color.WHITE)
      textSize = 22f
      gravity = Gravity.CENTER
      setTypeface(typeface, Typeface.BOLD)
    }
    col.addView(title, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    ).apply { bottomMargin = dp(8) })

    val msg = TextView(this).apply {
      text = "Para escanear códigos de barras, precisamos de permissão de câmera."
      setTextColor(Color.argb(180, 255, 255, 255))
      textSize = 15f
      gravity = Gravity.CENTER
    }
    col.addView(msg, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    ).apply { bottomMargin = dp(28) })

    val btn = TextView(this).apply {
      text = "Conceder permissão"
      setTextColor(Color.WHITE)
      textSize = 16f
      gravity = Gravity.CENTER
      setTypeface(typeface, Typeface.BOLD)
      setBackgroundColor(Color.rgb(99, 102, 241)) // indigo
      setPadding(dp(28), dp(14), dp(28), dp(14))
      val r = RectF(0f, 0f, 0f, 0f)
      setOnClickListener {
        ActivityCompat.requestPermissions(
          this@BarcodeScannerActivity,
          arrayOf(Manifest.permission.CAMERA),
          CAMERA_PERMISSION_REQUEST
        )
      }
    }
    col.addView(btn, LinearLayout.LayoutParams(
      dp(240), LinearLayout.LayoutParams.WRAP_CONTENT
    ).apply { gravity = Gravity.CENTER_HORIZONTAL })

    container.addView(col, FrameLayout.LayoutParams(
      FrameLayout.LayoutParams.MATCH_PARENT,
      FrameLayout.LayoutParams.MATCH_PARENT
    ))
    setContentView(container)
  }

  @SuppressLint("SetTextI18n")
  private fun buildUI() {
    val root = FrameLayout(this).apply {
      setBackgroundColor(Color.BLACK)
    }

    // Camera preview
    val previewView = PreviewView(this).apply {
      scaleType = PreviewView.ScaleType.FILL_CENTER
    }
    root.addView(previewView, FrameLayout.LayoutParams(
      FrameLayout.LayoutParams.MATCH_PARENT,
      FrameLayout.LayoutParams.MATCH_PARENT
    ))

    // Scanner overlay with corner guides
    root.addView(ScannerOverlayView(this), FrameLayout.LayoutParams(
      FrameLayout.LayoutParams.MATCH_PARENT,
      FrameLayout.LayoutParams.MATCH_PARENT
    ))

    // ── TOP STATUS PILL ──────────────────────────────────────────────────────
    val topBar = FrameLayout(this)
    val pill = buildStatusPill(false)
    statusPill = pill
    topBar.addView(pill, FrameLayout.LayoutParams(
      FrameLayout.LayoutParams.WRAP_CONTENT,
      FrameLayout.LayoutParams.WRAP_CONTENT,
      Gravity.CENTER_HORIZONTAL
    ))
    root.addView(topBar, FrameLayout.LayoutParams(
      FrameLayout.LayoutParams.MATCH_PARENT,
      FrameLayout.LayoutParams.WRAP_CONTENT
    ).apply { topMargin = dp(52) })

    // ── CLOSE BUTTON (top-right) ─────────────────────────────────────────────
    val closeBtn = buildCloseButton()
    root.addView(closeBtn, FrameLayout.LayoutParams(
      dp(44), dp(44), Gravity.TOP or Gravity.END
    ).apply {
      topMargin = dp(52)
      rightMargin = dp(16)
    })

    // ── CART BUTTON (top-left) — only in sale mode ───────────────────────────
    if (isSaleMode) {
      val cartWrapper = FrameLayout(this)
      cartBtnWrapper = cartWrapper

      val cartBtn = TextView(this).apply {
        text = "🛒 Ir para o carrinho"
        setTextColor(Color.WHITE)
        textSize = 13f
        gravity = Gravity.CENTER
        setTypeface(typeface, Typeface.BOLD)
        setPadding(dp(14), dp(10), dp(14), dp(10))
        val shape = android.graphics.drawable.GradientDrawable().apply {
          setColor(Color.argb(220, 22, 163, 74))
          cornerRadius = dp(24).toFloat()
        }
        background = shape
        setOnClickListener { finishWithAccumulatedItems() }
      }
      cartWrapper.addView(cartBtn, FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.WRAP_CONTENT,
        FrameLayout.LayoutParams.WRAP_CONTENT
      ))

      // Badge showing count of scanned items
      val badge = TextView(this).apply {
        text = "0"
        textSize = 10f
        setTextColor(Color.WHITE)
        gravity = Gravity.CENTER
        setTypeface(typeface, Typeface.BOLD)
        val shape = android.graphics.drawable.GradientDrawable().apply {
          setColor(Color.rgb(220, 38, 38))
          cornerRadius = dp(16).toFloat()
        }
        background = shape
        visibility = View.GONE
      }
      cartCountBadge = badge
      cartWrapper.addView(badge, FrameLayout.LayoutParams(dp(20), dp(20), Gravity.END or Gravity.TOP).apply {
        topMargin = -dp(4)
        rightMargin = -dp(4)
      })

      root.addView(cartWrapper, FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.WRAP_CONTENT,
        FrameLayout.LayoutParams.WRAP_CONTENT,
        Gravity.TOP or Gravity.START
      ).apply {
        topMargin = dp(52)
        leftMargin = dp(16)
      })
    }

    // ── INSTRUCTION TEXT ─────────────────────────────────────────────────────
    val instruction = TextView(this).apply {
      text = if (isSaleMode) "Leia vários itens — toque em 'Ir para o carrinho' ao finalizar"
             else "Alinhe o código de barras no retângulo"
      setTextColor(Color.WHITE)
      textSize = 13f
      gravity = Gravity.CENTER
      setPadding(dp(16), dp(8), dp(16), dp(8))
      setBackgroundColor(Color.argb(170, 0, 0, 0))
    }
    root.addView(instruction, FrameLayout.LayoutParams(
      FrameLayout.LayoutParams.WRAP_CONTENT,
      FrameLayout.LayoutParams.WRAP_CONTENT,
      Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
    ).apply { bottomMargin = dp(180) })

    // ── POPUP BOTTOM SHEET ────────────────────────────────────────────────────
    val popup = buildPopup()
    popupContainer = popup
    popup.visibility = View.GONE
    root.addView(popup, FrameLayout.LayoutParams(
      FrameLayout.LayoutParams.MATCH_PARENT,
      FrameLayout.LayoutParams.WRAP_CONTENT,
      Gravity.BOTTOM
    ))

    setContentView(root)

    // Apply window insets so the popup respects the navigation bar height
    root.setOnApplyWindowInsetsListener { _, insets ->
      val navBarHeight = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        insets.getInsets(WindowInsets.Type.navigationBars()).bottom
      } else {
        @Suppress("DEPRECATION")
        insets.systemWindowInsetBottom
      }
      // Apply extra bottom padding to the popup card
      (popup.getChildAt(0) as? LinearLayout)?.let { card ->
        val basePaddingBottom = dp(32)
        card.setPadding(dp(24), dp(20), dp(24), basePaddingBottom + navBarHeight)
      }
      insets
    }
    root.requestApplyInsets()

    startCamera(previewView)
  }

  private fun buildStatusPill(locked: Boolean): TextView {
    return TextView(this).apply {
      updatePillText(this, locked)
      setTextColor(Color.WHITE)
      textSize = 12f
      setTypeface(typeface, Typeface.BOLD)
      letterSpacing = 0.1f
      gravity = Gravity.CENTER
      setPadding(dp(18), dp(8), dp(18), dp(8))
      setBackgroundColor(if (locked) Color.argb(220, 220, 38, 38) else Color.argb(220, 22, 163, 74))
      val shape = android.graphics.drawable.GradientDrawable().apply {
        setColor(if (locked) Color.argb(220, 220, 38, 38) else Color.argb(220, 22, 163, 74))
        cornerRadius = dp(24).toFloat()
      }
      background = shape
    }
  }

  private fun updatePillText(pill: TextView, locked: Boolean) {
    val dot = "● "
    pill.text = dot + if (locked) "CONGELADO" else "PRONTO PARA LER"
  }

  private fun updateStatusPill(locked: Boolean) {
    runOnUiThread {
      val pill = statusPill ?: return@runOnUiThread
      updatePillText(pill, locked)
      val shape = android.graphics.drawable.GradientDrawable().apply {
        setColor(if (locked) Color.argb(220, 220, 38, 38) else Color.argb(220, 22, 163, 74))
        cornerRadius = dp(24).toFloat()
      }
      pill.background = shape
    }
  }

  private fun buildCloseButton(): TextView {
    return TextView(this).apply {
      text = "✕"
      setTextColor(Color.WHITE)
      textSize = 18f
      gravity = Gravity.CENTER
      val shape = android.graphics.drawable.GradientDrawable().apply {
        setColor(Color.argb(180, 0, 0, 0))
        cornerRadius = dp(22).toFloat()
      }
      background = shape
      setOnClickListener {
        if (isSaleMode && scannedItems.isNotEmpty()) {
          // Return accumulated items even if user closes
          finishWithAccumulatedItems()
        } else {
          finish()
        }
      }
    }
  }

  private fun updateCartBadge() {
    runOnUiThread {
      val totalItems = scannedItems.size
      val badge = cartCountBadge ?: return@runOnUiThread
      if (totalItems > 0) {
        badge.text = totalItems.toString()
        badge.visibility = View.VISIBLE
      } else {
        badge.visibility = View.GONE
      }
    }
  }

  @SuppressLint("SetTextI18n")
  private fun buildPopup(): FrameLayout {
    val container = FrameLayout(this)

    val card = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      setBackgroundColor(Color.WHITE)
      val shape = android.graphics.drawable.GradientDrawable().apply {
        setColor(Color.WHITE)
        cornerRadii = floatArrayOf(dp(24).toFloat(), dp(24).toFloat(), dp(24).toFloat(), dp(24).toFloat(), 0f, 0f, 0f, 0f)
      }
      background = shape
      setPadding(dp(24), dp(20), dp(24), dp(32))
      elevation = dp(16).toFloat()
    }

    // Drag handle
    val handle = View(this).apply {
      val shape = android.graphics.drawable.GradientDrawable().apply {
        setColor(Color.argb(60, 0, 0, 0))
        cornerRadius = dp(4).toFloat()
      }
      background = shape
    }
    card.addView(handle, LinearLayout.LayoutParams(dp(40), dp(4)).apply {
      gravity = Gravity.CENTER_HORIZONTAL
      bottomMargin = dp(16)
    })

    // Status label (DETECTADO / NÃO CADASTRADO)
    val statusLabel = TextView(this).apply {
      text = "DETECTADO"
      textSize = 10f
      letterSpacing = 0.15f
      setTypeface(typeface, Typeface.BOLD)
      setTextColor(Color.argb(140, 29, 27, 32))
    }
    card.addView(statusLabel, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    ).apply { bottomMargin = dp(4) })

    // Product name
    val nameText = TextView(this).apply {
      text = "—"
      textSize = 22f
      setTypeface(typeface, Typeface.BOLD)
      setTextColor(Color.rgb(29, 27, 32))
      maxLines = 2
    }
    productNameText = nameText
    card.addView(nameText, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    ).apply { bottomMargin = dp(4) })

    // Barcode
    val bcText = TextView(this).apply {
      text = "—"
      textSize = 13f
      setTextColor(Color.argb(180, 29, 27, 32))
      typeface = Typeface.MONOSPACE
    }
    barcodeText = bcText
    card.addView(bcText, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    ).apply { bottomMargin = dp(20) })

    // Divider
    val divider = View(this).apply {
      setBackgroundColor(Color.argb(25, 0, 0, 0))
    }
    card.addView(divider, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT, dp(1)
    ).apply { bottomMargin = dp(20) })

    // Quantity row
    val qtyRow = LinearLayout(this).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER_VERTICAL
    }

    val qtyLabel = TextView(this).apply {
      text = "Quantidade"
      textSize = 15f
      setTypeface(typeface, Typeface.BOLD)
      setTextColor(Color.rgb(29, 27, 32))
    }
    qtyRow.addView(qtyLabel, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))

    // Minus button
    val minusBtn = buildRoundBtn("−") {
      if (currentQuantity > 1) {
        currentQuantity--
        quantityText?.text = currentQuantity.toString()
      }
    }
    qtyRow.addView(minusBtn, LinearLayout.LayoutParams(dp(40), dp(40)))

    val qtyValueText = TextView(this).apply {
      text = "1"
      textSize = 18f
      setTypeface(typeface, Typeface.BOLD)
      setTextColor(Color.rgb(29, 27, 32))
      gravity = Gravity.CENTER
    }
    quantityText = qtyValueText
    qtyRow.addView(qtyValueText, LinearLayout.LayoutParams(dp(48), LinearLayout.LayoutParams.WRAP_CONTENT))

    // Plus button
    val plusBtn = buildRoundBtn("+") {
      currentQuantity++
      quantityText?.text = currentQuantity.toString()
    }
    qtyRow.addView(plusBtn, LinearLayout.LayoutParams(dp(40), dp(40)))

    card.addView(qtyRow, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    ).apply { bottomMargin = dp(20) })

    // Primary action button (Adicionar / Cadastrar Item)
    val actionBtn = TextView(this).apply {
      text = "Adicionar à venda"
      setTextColor(Color.WHITE)
      textSize = 16f
      gravity = Gravity.CENTER
      setTypeface(typeface, Typeface.BOLD)
      setPadding(dp(20), dp(16), dp(20), dp(16))
      val shape = android.graphics.drawable.GradientDrawable().apply {
        setColor(Color.rgb(99, 102, 241))
        cornerRadius = dp(14).toFloat()
      }
      background = shape
      setOnClickListener { confirmAction() }
    }
    card.addView(actionBtn, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    ).apply { bottomMargin = dp(10) })

    // Secondary: scan again
    val againBtn = TextView(this).apply {
      text = "Ler novamente"
      setTextColor(Color.rgb(99, 102, 241))
      textSize = 15f
      gravity = Gravity.CENTER
      setTypeface(typeface, Typeface.BOLD)
      setPadding(dp(20), dp(12), dp(20), dp(12))
      setOnClickListener { resetScan() }
    }
    card.addView(againBtn, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    ))

    container.addView(card, FrameLayout.LayoutParams(
      FrameLayout.LayoutParams.MATCH_PARENT,
      FrameLayout.LayoutParams.WRAP_CONTENT
    ))

    return container
  }

  private fun buildRoundBtn(label: String, onClick: () -> Unit): TextView {
    return TextView(this).apply {
      text = label
      textSize = 20f
      setTypeface(typeface, Typeface.BOLD)
      setTextColor(Color.rgb(99, 102, 241))
      gravity = Gravity.CENTER
      val shape = android.graphics.drawable.GradientDrawable().apply {
        setColor(Color.argb(20, 99, 102, 241))
        cornerRadius = dp(20).toFloat()
      }
      background = shape
      setOnClickListener { onClick() }
    }
  }

  @SuppressLint("SetTextI18n")
  private fun showPopup(code: String) {
    runOnUiThread {
      currentQuantity = 1
      quantityText?.text = "1"
      detectedCode = code
      isNotFound = false

      val cleanCode = code.trim()
      val productName = productMap[cleanCode]

      barcodeText?.text = "Cód: $cleanCode"

      if (productName != null) {
        // Product found
        productNameText?.text = productName
        isNotFound = false
        // Update action button text
        (popupContainer?.getChildAt(0) as? LinearLayout)?.let { card ->
          findActionButton(card)?.text = if (isSaleMode) "Adicionar à venda" else "Usar este código"
          findStatusLabel(card)?.apply {
            text = "DETECTADO"
            setTextColor(Color.argb(140, 29, 27, 32))
          }
          findQtyRow(card)?.visibility = if (isSaleMode) View.VISIBLE else View.GONE
        }
      } else {
        // Not found
        productNameText?.text = if (isSaleMode) "Código desconhecido" else code
        isNotFound = true
        (popupContainer?.getChildAt(0) as? LinearLayout)?.let { card ->
          findActionButton(card)?.text = if (isSaleMode) "Cadastrar item" else "Usar este código"
          findStatusLabel(card)?.apply {
            text = if (isSaleMode) "NÃO CADASTRADO" else "CÓDIGO LIDO"
            setTextColor(if (isSaleMode) Color.rgb(185, 28, 28) else Color.argb(140, 29, 27, 32))
          }
          findQtyRow(card)?.visibility = View.GONE
        }
      }

      val popup = popupContainer ?: return@runOnUiThread
      popup.visibility = View.VISIBLE
      val anim = TranslateAnimation(0f, 0f, popup.height.toFloat() + dp(200).toFloat(), 0f).apply {
        duration = 350
        interpolator = AccelerateDecelerateInterpolator()
      }
      popup.startAnimation(anim)
    }
  }

  private fun findActionButton(card: LinearLayout): TextView? {
    for (i in 0 until card.childCount) {
      val child = card.getChildAt(i)
      if (child is TextView && (child.text == "Adicionar à venda" || child.text == "Cadastrar item" || child.text == "Usar este código")) {
        return child
      }
    }
    return null
  }

  private fun findStatusLabel(card: LinearLayout): TextView? {
    for (i in 0 until card.childCount) {
      val child = card.getChildAt(i)
      if (child is TextView && (child.text.toString().contains("DETECTADO") || child.text.toString().contains("NÃO CADASTRADO") || child.text.toString().contains("CÓDIGO LIDO"))) {
        return child
      }
    }
    return null
  }

  private fun findQtyRow(card: LinearLayout): LinearLayout? {
    for (i in 0 until card.childCount) {
      val child = card.getChildAt(i)
      if (child is LinearLayout) return child
    }
    return null
  }

  private fun confirmAction() {
    val code = detectedCode ?: return

    if (isSaleMode) {
      // Accumulate the item and reset for next scan
      scannedItems.add(ScannedItem(code.trim(), currentQuantity, isNotFound))
      updateCartBadge()

      if (isNotFound) {
        // For "Cadastrar item" in sale mode — return immediately with single not-found result
        finishWithAccumulatedItems()
        return
      }

      // Show brief "✓ Adicionado!" feedback on action button
      val card = (popupContainer?.getChildAt(0) as? LinearLayout) ?: run { resetScan(); return }
      val actionBtn = findActionButton(card)
      val originalText = actionBtn?.text?.toString() ?: "Adicionar à venda"
      val originalBg = actionBtn?.background

      // Green feedback shape
      val successShape = android.graphics.drawable.GradientDrawable().apply {
        setColor(Color.rgb(22, 163, 74))
        cornerRadius = dp(14).toFloat()
      }
      actionBtn?.text = "✓ Adicionado!"
      actionBtn?.background = successShape
      actionBtn?.isEnabled = false

      Handler(Looper.getMainLooper()).postDelayed({
        // Reset after 800ms
        actionBtn?.text = originalText
        actionBtn?.background = originalBg
        actionBtn?.isEnabled = true
        resetScan()
      }, 800)
    } else {
      // Single mode (product registration)
      val intent = Intent()
      intent.putExtra(EXTRA_BARCODE, code)
      intent.putExtra(EXTRA_QUANTITY, 1)
      intent.putExtra(EXTRA_NOT_FOUND, false)
      setResult(Activity.RESULT_OK, intent)
      finish()
    }
  }

  private fun finishWithAccumulatedItems() {
    val arr = JSONArray()
    for (item in scannedItems) {
      val obj = JSONObject()
      obj.put("barcode", item.barcode)
      obj.put("quantity", item.quantity)
      obj.put("notFound", item.notFound)
      arr.put(obj)
    }
    val intent = Intent()
    intent.putExtra(EXTRA_ITEMS_JSON, arr.toString())
    setResult(Activity.RESULT_OK, intent)
    finish()
  }

  private fun resetScan() {
    runOnUiThread {
      val popup = popupContainer ?: return@runOnUiThread
      val anim = TranslateAnimation(0f, 0f, 0f, popup.height.toFloat() + dp(200).toFloat()).apply {
        duration = 280
        interpolator = AccelerateDecelerateInterpolator()
      }
      anim.setAnimationListener(object : android.view.animation.Animation.AnimationListener {
        override fun onAnimationStart(a: android.view.animation.Animation?) {}
        override fun onAnimationRepeat(a: android.view.animation.Animation?) {}
        override fun onAnimationEnd(a: android.view.animation.Animation?) {
          popup.visibility = View.GONE
          isLocked = false
          detectedCode = null
          updateStatusPill(false)
        }
      })
      popup.startAnimation(anim)
    }
  }

  private fun startCamera(previewView: PreviewView) {
    val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
    cameraProviderFuture.addListener({
      val provider = cameraProviderFuture.get()
      cameraProvider = provider

      val preview = Preview.Builder().build().also {
        it.setSurfaceProvider(previewView.surfaceProvider)
      }

      val imageAnalysis = ImageAnalysis.Builder()
        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
        .setTargetResolution(Size(640, 480))
        .build()
        .also { analysis ->
          analysis.setAnalyzer(cameraExecutor) { imageProxy ->
            analyzeImage(imageProxy)
          }
        }

      try {
        provider.unbindAll()
        provider.bindToLifecycle(
          this,
          CameraSelector.DEFAULT_BACK_CAMERA,
          preview,
          imageAnalysis
        )
      } catch (_: Exception) {
        finish()
      }
    }, ContextCompat.getMainExecutor(this))
  }

  @androidx.annotation.OptIn(ExperimentalGetImage::class)
  private fun analyzeImage(imageProxy: ImageProxy) {
    if (isLocked) {
      imageProxy.close()
      return
    }

    val mediaImage = imageProxy.image
    if (mediaImage == null) {
      imageProxy.close()
      return
    }

    val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
    barcodeScanner.process(image)
      .addOnSuccessListener { barcodes ->
        val code = barcodes.firstOrNull()?.rawValue?.trim()
        if (!code.isNullOrEmpty() && !isLocked) {
          isLocked = true
          updateStatusPill(true)
          vibrate()
          showPopup(code)
        }
      }
      .addOnCompleteListener {
        imageProxy.close()
      }
  }

  @SuppressLint("MissingPermission")
  private fun vibrate() {
    val vibrator = getSystemService(Vibrator::class.java) ?: return
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      vibrator.vibrate(VibrationEffect.createOneShot(55, VibrationEffect.DEFAULT_AMPLITUDE))
    } else {
      @Suppress("DEPRECATION")
      vibrator.vibrate(55)
    }
  }

  override fun onRequestPermissionsResult(
    requestCode: Int,
    permissions: Array<String>,
    grantResults: IntArray
  ) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults)
    if (requestCode == CAMERA_PERMISSION_REQUEST && hasCameraPermission()) {
      buildUI()
    } else {
      finish()
    }
  }

  override fun onDestroy() {
    cameraProvider?.unbindAll()
    barcodeScanner.close()
    cameraExecutor.shutdown()
    super.onDestroy()
  }

  private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

  companion object {
    const val EXTRA_BARCODE = "barcode"
    const val EXTRA_QUANTITY = "quantity"
    const val EXTRA_NOT_FOUND = "not_found"
    const val EXTRA_PRODUCTS_JSON = "products_json"
    const val EXTRA_ITEMS_JSON = "items_json"
    private const val CAMERA_PERMISSION_REQUEST = 4007
  }
}

private class ScannerOverlayView(context: android.content.Context) : View(context) {
  init {
    setLayerType(LAYER_TYPE_SOFTWARE, null)
  }

  private val dimPaint = Paint().apply { color = Color.argb(150, 0, 0, 0) }
  private val clearPaint = Paint().apply {
    xfermode = PorterDuffXfermode(PorterDuff.Mode.CLEAR)
    isAntiAlias = true
  }
  private val cornerPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    color = Color.rgb(208, 188, 255)
    strokeWidth = 9f
    style = Paint.Style.STROKE
    strokeCap = Paint.Cap.ROUND
  }
  private val linePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    color = Color.argb(200, 208, 188, 255)
    strokeWidth = 3.5f
    strokeCap = Paint.Cap.ROUND
  }

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    val save = canvas.saveLayer(0f, 0f, width.toFloat(), height.toFloat(), null)
    canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), dimPaint)

    val boxWidth = width * 0.80f
    val boxHeight = boxWidth * 0.58f
    val left = (width - boxWidth) / 2f
    val top = (height - boxHeight) / 2f - height * 0.05f
    val right = left + boxWidth
    val bottom = top + boxHeight
    val radius = 28f
    val rect = RectF(left, top, right, bottom)
    val path = Path().apply {
      addRoundRect(rect, radius, radius, Path.Direction.CW)
    }
    canvas.drawPath(path, clearPaint)
    canvas.restoreToCount(save)

    val corner = 52f
    // Top-left
    canvas.drawLine(left, top + corner, left, top, cornerPaint)
    canvas.drawLine(left, top, left + corner, top, cornerPaint)
    // Top-right
    canvas.drawLine(right, top + corner, right, top, cornerPaint)
    canvas.drawLine(right, top, right - corner, top, cornerPaint)
    // Bottom-left
    canvas.drawLine(left, bottom - corner, left, bottom, cornerPaint)
    canvas.drawLine(left, bottom, left + corner, bottom, cornerPaint)
    // Bottom-right
    canvas.drawLine(right, bottom - corner, right, bottom, cornerPaint)
    canvas.drawLine(right, bottom, right - corner, bottom, cornerPaint)

    // Scanner line
    val midY = top + boxHeight / 2f
    canvas.drawLine(left + 20f, midY, right - 20f, midY, linePaint)
  }
}
