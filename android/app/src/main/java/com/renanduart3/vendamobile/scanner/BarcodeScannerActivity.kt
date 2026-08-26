package com.renanduart3.vendamobile.scanner

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.RectF
import android.os.Bundle
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Size
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.widget.FrameLayout
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
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class BarcodeScannerActivity : ComponentActivity() {
  private lateinit var cameraExecutor: ExecutorService
  private lateinit var barcodeScanner: BarcodeScanner
  private var cameraProvider: ProcessCameraProvider? = null
  private var isLocked = false
  private var detectedCode: String? = null
  private var frozenOverlay: FrameLayout? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    requestWindowFeature(Window.FEATURE_NO_TITLE)
    window.statusBarColor = Color.BLACK
    window.navigationBarColor = Color.BLACK

    cameraExecutor = Executors.newSingleThreadExecutor()
    barcodeScanner = BarcodeScanning.getClient(
      BarcodeScannerOptions.Builder()
        .setBarcodeFormats(
          Barcode.FORMAT_EAN_13,
          Barcode.FORMAT_EAN_8,
          Barcode.FORMAT_CODE_128,
          Barcode.FORMAT_UPC_A,
          Barcode.FORMAT_UPC_E
        )
        .build()
    )

    if (hasCameraPermission()) {
      showScanner()
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

    val message = TextView(this).apply {
      text = "Permita o acesso a camera para escanear codigos de barras."
      setTextColor(Color.WHITE)
      textSize = 18f
      gravity = Gravity.CENTER
      setPadding(dp(28), dp(20), dp(28), dp(20))
    }
    container.addView(
      message,
      FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.WRAP_CONTENT,
        Gravity.CENTER
      )
    )

    val action = TextView(this).apply {
      text = "Conceder permissao"
      setTextColor(Color.WHITE)
      textSize = 16f
      gravity = Gravity.CENTER
      setPadding(dp(18), dp(12), dp(18), dp(12))
      setBackgroundColor(Color.rgb(21, 94, 239))
      setOnClickListener {
        ActivityCompat.requestPermissions(
          this@BarcodeScannerActivity,
          arrayOf(Manifest.permission.CAMERA),
          CAMERA_PERMISSION_REQUEST
        )
      }
    }
    val actionParams = FrameLayout.LayoutParams(
      FrameLayout.LayoutParams.WRAP_CONTENT,
      FrameLayout.LayoutParams.WRAP_CONTENT,
      Gravity.CENTER_HORIZONTAL or Gravity.CENTER_VERTICAL
    ).apply { topMargin = dp(112) }
    container.addView(action, actionParams)
    setContentView(container)
  }

  private fun showScanner() {
    val root = FrameLayout(this).apply {
      setBackgroundColor(Color.BLACK)
      layoutParams = ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT
      )
    }

    val previewView = PreviewView(this).apply {
      scaleType = PreviewView.ScaleType.FILL_CENTER
    }
    root.addView(
      previewView,
      FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.MATCH_PARENT
      )
    )

    root.addView(
      ScannerOverlayView(this),
      FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.MATCH_PARENT
      )
    )

    frozenOverlay = FrameLayout(this).apply {
      setBackgroundColor(Color.argb(110, 0, 0, 0))
      visibility = View.GONE
    }
    root.addView(
      frozenOverlay,
      FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.MATCH_PARENT
      )
    )

    val close = TextView(this).apply {
      text = "X"
      setTextColor(Color.WHITE)
      textSize = 20f
      gravity = Gravity.CENTER
      setBackgroundColor(Color.argb(170, 0, 0, 0))
      setOnClickListener { finish() }
    }
    root.addView(
      close,
      FrameLayout.LayoutParams(dp(48), dp(48), Gravity.TOP or Gravity.END).apply {
        topMargin = dp(22)
        rightMargin = dp(16)
      }
    )

    val instruction = TextView(this).apply {
      text = "Alinhe o codigo de barras no retangulo"
      setTextColor(Color.WHITE)
      textSize = 14f
      gravity = Gravity.CENTER
      setPadding(dp(16), dp(8), dp(16), dp(8))
      setBackgroundColor(Color.argb(190, 0, 0, 0))
    }
    root.addView(
      instruction,
      FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.WRAP_CONTENT,
        FrameLayout.LayoutParams.WRAP_CONTENT,
        Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
      ).apply { bottomMargin = dp(42) }
    )

    setContentView(root)
    startCamera(previewView)
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
          detectedCode = code
          vibrate()
          showFrozenState(code)
        }
      }
      .addOnCompleteListener {
        imageProxy.close()
      }
  }

  private fun showFrozenState(code: String) {
    val overlay = frozenOverlay ?: return
    overlay.removeAllViews()
    overlay.visibility = View.VISIBLE

    val panel = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      setBackgroundColor(Color.argb(230, 15, 23, 42))
      setPadding(dp(24), dp(22), dp(24), dp(22))
    }
    val message = TextView(this).apply {
      text = "Código lido\\n$code"
      setTextColor(Color.WHITE)
      textSize = 18f
      gravity = Gravity.CENTER
    }
    panel.addView(message, LinearLayout.LayoutParams(
      FrameLayout.LayoutParams.MATCH_PARENT,
      0,
      1f
    ))

    val useCode = TextView(this).apply {
      text = "Usar código"
      setTextColor(Color.WHITE)
      textSize = 16f
      gravity = Gravity.CENTER
      setBackgroundColor(Color.rgb(21, 94, 239))
      setOnClickListener {
        setResult(Activity.RESULT_OK, Intent().putExtra(EXTRA_BARCODE, detectedCode))
        finish()
      }
    }
    panel.addView(useCode, LinearLayout.LayoutParams(
      FrameLayout.LayoutParams.MATCH_PARENT,
      dp(52),
    ))

    val scanAgain = TextView(this).apply {
      text = "Ler novamente"
      setTextColor(Color.WHITE)
      textSize = 15f
      gravity = Gravity.CENTER
      setOnClickListener {
        detectedCode = null
        isLocked = false
        overlay.visibility = View.GONE
      }
    }
    panel.addView(scanAgain, LinearLayout.LayoutParams(
      FrameLayout.LayoutParams.MATCH_PARENT,
      dp(48)
    ))

    overlay.addView(panel, FrameLayout.LayoutParams(
      dp(300),
      dp(220),
      Gravity.CENTER
    ))
  }

  @SuppressLint("MissingPermission")
  private fun vibrate() {
    val vibrator = getSystemService(Vibrator::class.java) ?: return
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      vibrator.vibrate(VibrationEffect.createOneShot(45, VibrationEffect.DEFAULT_AMPLITUDE))
    } else {
      @Suppress("DEPRECATION")
      vibrator.vibrate(45)
    }
  }

  override fun onRequestPermissionsResult(
    requestCode: Int,
    permissions: Array<String>,
    grantResults: IntArray
  ) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults)
    if (requestCode == CAMERA_PERMISSION_REQUEST && hasCameraPermission()) {
      showScanner()
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
    private const val CAMERA_PERMISSION_REQUEST = 4007
  }
}

private class ScannerOverlayView(context: android.content.Context) : View(context) {
  init {
    setLayerType(LAYER_TYPE_SOFTWARE, null)
  }

  private val dimPaint = Paint().apply { color = Color.argb(130, 0, 0, 0) }
  private val clearPaint = Paint().apply {
    xfermode = PorterDuffXfermode(PorterDuff.Mode.CLEAR)
    isAntiAlias = true
  }
  private val cornerPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    color = Color.rgb(208, 188, 255)
    strokeWidth = 8f
    style = Paint.Style.STROKE
    strokeCap = Paint.Cap.ROUND
  }
  private val linePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    color = Color.argb(230, 208, 188, 255)
    strokeWidth = 4f
    strokeCap = Paint.Cap.ROUND
  }

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    val save = canvas.saveLayer(0f, 0f, width.toFloat(), height.toFloat(), null)
    canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), dimPaint)

    val boxWidth = width * 0.75f
    val boxHeight = boxWidth * 0.60f
    val left = (width - boxWidth) / 2f
    val top = (height - boxHeight) / 2f
    val right = left + boxWidth
    val bottom = top + boxHeight
    val radius = 28f
    val rect = RectF(left, top, right, bottom)
    val path = Path().apply {
      addRoundRect(rect, radius, radius, Path.Direction.CW)
    }
    canvas.drawPath(path, clearPaint)
    canvas.restoreToCount(save)

    val corner = 48f
    canvas.drawLine(left, top + corner, left, top, cornerPaint)
    canvas.drawLine(left, top, left + corner, top, cornerPaint)
    canvas.drawLine(right, top + corner, right, top, cornerPaint)
    canvas.drawLine(right, top, right - corner, top, cornerPaint)
    canvas.drawLine(left, bottom - corner, left, bottom, cornerPaint)
    canvas.drawLine(left, bottom, left + corner, bottom, cornerPaint)
    canvas.drawLine(right, bottom - corner, right, bottom, cornerPaint)
    canvas.drawLine(right, bottom, right - corner, bottom, cornerPaint)

    val midY = top + boxHeight / 2f
    canvas.drawLine(left + 20f, midY, right - 20f, midY, linePaint)
  }
}
