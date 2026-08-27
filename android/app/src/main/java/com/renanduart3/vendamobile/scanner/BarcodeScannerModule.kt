package com.renanduart3.vendamobile.scanner

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import org.json.JSONArray

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

      if (resultCode == Activity.RESULT_OK && data != null) {
        // Multi-item result (sale mode)
        val itemsJson = data.getStringExtra(BarcodeScannerActivity.EXTRA_ITEMS_JSON)
        if (!itemsJson.isNullOrBlank()) {
          try {
            val arr = JSONArray(itemsJson)
            val resultArray = WritableNativeArray()
            for (i in 0 until arr.length()) {
              val obj = arr.getJSONObject(i)
              val map = WritableNativeMap().apply {
                putString("barcode", obj.optString("barcode", ""))
                putInt("quantity", obj.optInt("quantity", 1))
                putBoolean("notFound", obj.optBoolean("notFound", false))
              }
              resultArray.pushMap(map)
            }
            promise.resolve(resultArray)
            return
          } catch (_: Exception) {}
        }

        // Single-item result (product registration mode / legacy)
        val barcode = data.getStringExtra(BarcodeScannerActivity.EXTRA_BARCODE)
        val quantity = data.getIntExtra(BarcodeScannerActivity.EXTRA_QUANTITY, 1)
        val notFound = data.getBooleanExtra(BarcodeScannerActivity.EXTRA_NOT_FOUND, false)

        val resultArray = WritableNativeArray()
        val result = WritableNativeMap().apply {
          putString("barcode", barcode)
          putInt("quantity", quantity)
          putBoolean("notFound", notFound)
        }
        resultArray.pushMap(result)
        promise.resolve(resultArray)
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
  fun openScanner(productsJson: String?, promise: Promise) {
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
      val intent = Intent(activity, BarcodeScannerActivity::class.java)
      if (!productsJson.isNullOrBlank()) {
        intent.putExtra(BarcodeScannerActivity.EXTRA_PRODUCTS_JSON, productsJson)
      }
      activity.startActivityForResult(intent, REQUEST_CODE)
    } catch (error: Exception) {
      pendingPromise = null
      promise.reject("SCANNER_OPEN_FAILED", "Nao foi possivel abrir o scanner.", error)
    }
  }

  companion object {
    private const val REQUEST_CODE = 7381
  }
}
