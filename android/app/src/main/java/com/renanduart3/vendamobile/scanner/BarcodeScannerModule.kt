package com.renanduart3.vendamobile.scanner

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class BarcodeScannerModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {
  private var pendingPromise: Promise? = null

  private val activityEventListener: ActivityEventListener = object : BaseActivityEventListener() {
    override fun onActivityResult(
      activity: Activity,
      requestCode: Int,
      resultCode: Int,
      data: Intent?
    ) {
      if (requestCode != REQUEST_CODE) return

      val promise = pendingPromise ?: return
      pendingPromise = null

      if (resultCode == Activity.RESULT_OK) {
        promise.resolve(data?.getStringExtra(BarcodeScannerActivity.EXTRA_BARCODE))
      } else {
        promise.resolve(null)
      }
    }
  }

  init {
    reactContext.addActivityEventListener(activityEventListener)
  }

  override fun getName(): String = "BarcodeScannerModule"

  @ReactMethod
  fun openScanner(promise: Promise) {
    if (pendingPromise != null) {
      promise.reject("SCANNER_BUSY", "O scanner ja esta aberto.")
      return
    }

    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "Nao foi possivel abrir a camera agora.")
      return
    }

    pendingPromise = promise
    try {
      activity.startActivityForResult(
        Intent(activity, BarcodeScannerActivity::class.java),
        REQUEST_CODE
      )
    } catch (error: Exception) {
      pendingPromise = null
      promise.reject("SCANNER_OPEN_FAILED", "Nao foi possivel abrir o scanner.", error)
    }
  }

  companion object {
    private const val REQUEST_CODE = 7381
  }
}
