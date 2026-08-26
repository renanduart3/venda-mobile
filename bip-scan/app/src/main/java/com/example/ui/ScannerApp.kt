@file:kotlin.OptIn(com.google.accompanist.permissions.ExperimentalPermissionsApi::class)
package com.example.ui

import android.Manifest
import android.annotation.SuppressLint
import android.os.Build
import android.util.Size
import androidx.annotation.OptIn
import androidx.camera.core.CameraSelector
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Storefront
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.RoundRect
import androidx.compose.ui.geometry.Size as ComposeSize
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.core.content.ContextCompat
import com.example.data.Produto
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.Locale

enum class AppScreen {
    SCANNER,
    CADASTRO
}

@Composable
fun ScannerApp(viewModel: ScannerViewModel) {
    var currentScreen by remember { mutableStateOf(AppScreen.SCANNER) }
    
    // Manage status and navigation bar insets to maintain proper visual edge-to-edge layout
    val systemBarsPadding = WindowInsets.statusBars.asPaddingValues()
    val navBarsPadding = WindowInsets.navigationBars.asPaddingValues()

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = Color(0xFF2B2930),
                tonalElevation = 8.dp,
                modifier = Modifier.height(80.dp)
            ) {
                NavigationBarItem(
                    selected = currentScreen == AppScreen.SCANNER,
                    onClick = { currentScreen = AppScreen.SCANNER },
                    icon = {
                        Icon(
                            imageVector = Icons.Default.QrCodeScanner,
                            contentDescription = "Modo Scanner Loja"
                        )
                    },
                    label = { Text("Modo Loja") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFF1D1B20),
                        selectedTextColor = Color.White,
                        indicatorColor = Color(0xFFE8DEF8),
                        unselectedIconColor = Color.White.copy(alpha = 0.6f),
                        unselectedTextColor = Color.White.copy(alpha = 0.6f)
                    ),
                    modifier = Modifier.testTag("nav_scanner")
                )
                NavigationBarItem(
                    selected = currentScreen == AppScreen.CADASTRO,
                    onClick = { currentScreen = AppScreen.CADASTRO },
                    icon = {
                        Icon(
                            imageVector = Icons.Default.Storefront,
                            contentDescription = "Simulador de Retaguarda Cadastro"
                        )
                    },
                    label = { Text("Cadastro") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFF1D1B20),
                        selectedTextColor = Color.White,
                        indicatorColor = Color(0xFFE8DEF8),
                        unselectedIconColor = Color.White.copy(alpha = 0.6f),
                        unselectedTextColor = Color.White.copy(alpha = 0.6f)
                    ),
                    modifier = Modifier.testTag("nav_cadastro")
                )
            }
        },
        contentWindowInsets = WindowInsets(0.dp)
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = innerPadding.calculateBottomPadding())
        ) {
            when (currentScreen) {
                AppScreen.SCANNER -> ScannerScreen(viewModel = viewModel)
                AppScreen.CADASTRO -> CadastroScreen(viewModel = viewModel)
            }
        }
    }
}

@kotlin.OptIn(com.google.accompanist.permissions.ExperimentalPermissionsApi::class)
@Composable
fun ScannerScreen(viewModel: ScannerViewModel) {
    val cameraPermissionState = rememberPermissionState(permission = Manifest.permission.CAMERA)
    val uiState by viewModel.uiState.collectAsState()
    val haptic = LocalHapticFeedback.current

    LaunchedEffect(Unit) {
        if (!cameraPermissionState.status.isGranted) {
            cameraPermissionState.launchPermissionRequest()
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        if (cameraPermissionState.status.isGranted) {
            // Background Layer: Optimized CameraX View
            CameraPreviewView(
                isLocked = uiState.isScanningLocked,
                onBarcodeDetected = { barcode ->
                    viewModel.onBarcodeScanned(barcode) {
                        haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                    }
                },
                modifier = Modifier.fillMaxSize()
            )

            // Scanning reticle and overlay guide
            ScannerOverlayGuide()
        } else {
            // Permission missing fallback
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xFF1E293B))
                    .padding(32.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    imageVector = Icons.Default.CameraAlt,
                    contentDescription = null,
                    tint = Color.White.copy(alpha = 0.6f),
                    modifier = Modifier.size(64.dp)
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Acesso à Câmera Necessário",
                    color = Color.White,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Para bipar códigos de barras em milissegundos, precisamos de permissão de câmera nativa.",
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 14.sp,
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(24.dp))
                Button(
                    onClick = { cameraPermissionState.launchPermissionRequest() },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Text("Conceder Permissão")
                }
            }
        }

        // Top Status indicator (cooldown state, etc)
        TopBannerHeader(
            isScanningLocked = uiState.isScanningLocked,
            onReset = { viewModel.resetScanState() }
        )

        // Bottom Result Card overlay
        AnimatedVisibility(
            visible = uiState.scanResult is ScanResult.Success || uiState.scanResult is ScanResult.NotFound,
            enter = slideInVertically(
                initialOffsetY = { it },
                animationSpec = tween(durationMillis = 350)
            ),
            exit = slideOutVertically(
                targetOffsetY = { it },
                animationSpec = tween(durationMillis = 300)
            ),
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(16.dp)
                .fillMaxWidth()
        ) {
            when (val result = uiState.scanResult) {
                is ScanResult.Success -> {
                    ProductResultCard(
                        produto = result.produto,
                        quantidade = result.quantidade,
                        totalCalculado = result.totalCalculado,
                        onDismiss = { viewModel.resetScanState() }
                    )
                }
                is ScanResult.NotFound -> {
                    ProductNotFoundCard(
                        barcode = result.barcode,
                        onDismiss = { viewModel.resetScanState() }
                    )
                }
                else -> {}
            }
        }

        // Variable Quantity Modal Bottom Sheet / Dialog
        if (uiState.scanResult is ScanResult.SuccessVariableQtyRequired) {
            val product = (uiState.scanResult as ScanResult.SuccessVariableQtyRequired).produto
            VariableQuantityDialog(
                produto = product,
                onConfirm = { qty -> viewModel.confirmVariableQuantity(qty) },
                onCancel = { viewModel.cancelVariableQuantity() }
            )
        }
    }
}

@Composable
fun TopBannerHeader(isScanningLocked: Boolean, onReset: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .statusBarsPadding()
            .padding(16.dp)
    ) {
        Surface(
            color = if (isScanningLocked) Color(0xD9E11D48) else Color(0xD910B981),
            shape = RoundedCornerShape(24.dp),
            tonalElevation = 4.dp,
            modifier = Modifier.align(Alignment.Center)
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .background(Color.White, CircleShape)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (isScanningLocked) "CONGELADO (COOLDOWN)" else "PRONTO PARA LER",
                    color = Color.White,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                if (isScanningLocked) {
                    Spacer(modifier = Modifier.width(8.dp))
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Limpar trava",
                        tint = Color.White,
                        modifier = Modifier
                            .size(16.dp)
                            .clickable { onReset() }
                    )
                }
            }
        }
    }
}

@Composable
fun ScannerOverlayGuide() {
    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        val width = constraints.maxWidth.toFloat()
        val height = constraints.maxHeight.toFloat()
        
        // Define standard box size
        val boxWidth = width * 0.75f
        val boxHeight = boxWidth * 0.6f // Rectangular EAN guide
        
        val left = (width - boxWidth) / 2
        val top = (height - boxHeight) / 2
        val right = left + boxWidth
        val bottom = top + boxHeight

        Canvas(modifier = Modifier.fillMaxSize()) {
            val roundRect = RoundRect(
                rect = Rect(left, top, right, bottom),
                cornerRadius = CornerRadius(16.dp.toPx(), 16.dp.toPx())
            )

            // Draw translucent shadow background using clipPath and blend modes
            val path = Path().apply {
                addRoundRect(roundRect)
            }
            
            // Outer semi-transparent layer
            drawRect(
                color = Color.Black.copy(alpha = 0.5f),
                size = ComposeSize(width, height)
            )
            
            // Cutout standard scanner rectangle EAN
            drawPath(
                path = path,
                color = Color.Transparent,
                blendMode = BlendMode.Clear
            )

            // Draw visual high-contrast neon corners
            val strokeWidth = 4.dp.toPx()
            val cornerLength = 24.dp.toPx()
            val cornerColor = Color(0xFFD0BCFF) // Neon lavender scanner guide

            // Top-Left Corner
            drawLine(
                color = cornerColor,
                start = Offset(left, top + cornerLength),
                end = Offset(left, top),
                strokeWidth = strokeWidth,
                cap = StrokeCap.Round
            )
            drawLine(
                color = cornerColor,
                start = Offset(left, top),
                end = Offset(left + cornerLength, top),
                strokeWidth = strokeWidth,
                cap = StrokeCap.Round
            )

            // Top-Right Corner
            drawLine(
                color = cornerColor,
                start = Offset(right, top + cornerLength),
                end = Offset(right, top),
                strokeWidth = strokeWidth,
                cap = StrokeCap.Round
            )
            drawLine(
                color = cornerColor,
                start = Offset(right, top),
                end = Offset(right - cornerLength, top),
                strokeWidth = strokeWidth,
                cap = StrokeCap.Round
            )

            // Bottom-Left Corner
            drawLine(
                color = cornerColor,
                start = Offset(left, bottom - cornerLength),
                end = Offset(left, bottom),
                strokeWidth = strokeWidth,
                cap = StrokeCap.Round
            )
            drawLine(
                color = cornerColor,
                start = Offset(left, bottom),
                end = Offset(left + cornerLength, bottom),
                strokeWidth = strokeWidth,
                cap = StrokeCap.Round
            )

            // Bottom-Right Corner
            drawLine(
                color = cornerColor,
                start = Offset(right, bottom - cornerLength),
                end = Offset(right, bottom),
                strokeWidth = strokeWidth,
                cap = StrokeCap.Round
            )
            drawLine(
                color = cornerColor,
                start = Offset(right, bottom),
                end = Offset(right - cornerLength, bottom),
                strokeWidth = strokeWidth,
                cap = StrokeCap.Round
            )

            // Scanner animated horizontal neon lavender beam
            val lineY = top + (boxHeight / 2)
            drawLine(
                color = Color(0xFFD0BCFF).copy(alpha = 0.9f),
                start = Offset(left + 8.dp.toPx(), lineY),
                end = Offset(right - 8.dp.toPx(), lineY),
                strokeWidth = 3.dp.toPx()
            )
        }

        // Instructive banner at top of the frame
        Text(
            text = "Alinhe o Código de Barras no Retângulo",
            color = Color.White.copy(alpha = 0.9f),
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            modifier = Modifier
                .align(Alignment.Center)
                .padding(bottom = 180.dp)
                .background(Color.Black.copy(alpha = 0.6f), RoundedCornerShape(12.dp))
                .padding(horizontal = 16.dp, vertical = 6.dp)
        )
    }
}

@SuppressLint("UnsafeOptInUsageError")
@Composable
fun CameraPreviewView(
    isLocked: Boolean,
    onBarcodeDetected: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val cameraProviderFuture = remember { ProcessCameraProvider.getInstance(context) }

    AndroidView(
        factory = { ctx ->
            val previewView = PreviewView(ctx).apply {
                scaleType = PreviewView.ScaleType.FILL_CENTER
            }
            val executor = ContextCompat.getMainExecutor(ctx)

            cameraProviderFuture.addListener({
                val cameraProvider = cameraProviderFuture.get()
                
                // Configure high-performance preview use case
                val preview = Preview.Builder().build().also {
                    it.surfaceProvider = previewView.surfaceProvider
                }

                // High speed analyzer configuration (Resolution: medium 640x480 for fast performance on CPU)
                val imageAnalysis = ImageAnalysis.Builder()
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .setTargetResolution(Size(640, 480))
                    .build()

                val options = BarcodeScannerOptions.Builder()
                    .setBarcodeFormats(Barcode.FORMAT_EAN_13, Barcode.FORMAT_EAN_8, Barcode.FORMAT_CODE_128, Barcode.FORMAT_UPC_A, Barcode.FORMAT_UPC_E)
                    .build()
                val barcodeScanner = BarcodeScanning.getClient(options)

                imageAnalysis.setAnalyzer(executor) { imageProxy ->
                    val mediaImage = imageProxy.image
                    // Immediately skip ML processing if scanner is in COOLDOWN lock
                    if (isLocked || mediaImage == null) {
                        imageProxy.close()
                        return@setAnalyzer
                    }

                    val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
                    barcodeScanner.process(image)
                        .addOnSuccessListener { barcodes ->
                            val barcode = barcodes.firstOrNull()?.rawValue
                            if (barcode != null && !isLocked) {
                                onBarcodeDetected(barcode)
                            }
                        }
                        .addOnCompleteListener {
                            imageProxy.close()
                        }
                }

                val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

                try {
                    cameraProvider.unbindAll()
                    cameraProvider.bindToLifecycle(
                        lifecycleOwner,
                        cameraSelector,
                        preview,
                        imageAnalysis
                    )
                } catch (exc: Exception) {
                    // Fail gracefully
                }
            }, executor)
            previewView
        },
        modifier = modifier
    )
}

@Composable
fun ProductResultCard(
    produto: Produto,
    quantidade: Int?,
    totalCalculado: Double?,
    onDismiss: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("result_card"),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFE8DEF8)), // Soft Pastel Lavender
        elevation = CardDefaults.cardElevation(defaultElevation = 12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Elegant brand/product avatar badge on the left
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .background(Color(0xFF6750A4), RoundedCornerShape(16.dp)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = produto.nome.take(1).uppercase(),
                    color = Color.White,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                )
            }

            // Central details section
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "DETECTADO",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color(0xFF1D1B20).copy(alpha = 0.6f),
                    letterSpacing = 1.sp
                )
                Text(
                    text = produto.nome,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF1D1B20),
                    modifier = Modifier.testTag("result_nome")
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "EAN: ${produto.codigoBarras} | ${produto.tipoUnidade}",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = Color(0xFF1D1B20).copy(alpha = 0.8f)
                )
            }

            // Right price / info display
            Column(
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = if (quantidade != null) "TOTAL" else "PREÇO",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color(0xFF1D1B20).copy(alpha = 0.6f),
                    letterSpacing = 1.sp
                )
                val displayPrice = totalCalculado ?: produto.preco
                Text(
                    text = String.format(Locale.US, "R$ %.2f", displayPrice),
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFF1D1B20),
                    modifier = Modifier.testTag("result_preco")
                )
                if (quantidade != null) {
                    Text(
                        text = "Qtd: $quantidade",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF6750A4)
                    )
                }
            }

            // Quick close option
            IconButton(
                onClick = onDismiss,
                modifier = Modifier
                    .size(24.dp)
                    .align(Alignment.Top)
            ) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Fechar card",
                    tint = Color(0xFF1D1B20).copy(alpha = 0.5f),
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}

@Composable
fun ProductNotFoundCard(
    barcode: String,
    onDismiss: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("not_found_card"),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF2F2)), // Light crimson alert
        elevation = CardDefaults.cardElevation(defaultElevation = 12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Elegant red info badge
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .background(Color(0xFFEF4444), RoundedCornerShape(16.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Info,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(24.dp)
                )
            }

            // Central details section
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "NÃO CADASTRADO",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color(0xFF7F1D1D).copy(alpha = 0.6f),
                    letterSpacing = 1.sp
                )
                Text(
                    text = "Código Desconhecido",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF7F1D1D)
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "Código: $barcode",
                    fontSize = 12.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF991B1B)
                )
            }

            // Quick close option
            IconButton(
                onClick = onDismiss,
                modifier = Modifier
                    .size(24.dp)
                    .align(Alignment.Top)
            ) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Fechar card",
                    tint = Color(0xFF7F1D1D).copy(alpha = 0.5f),
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}

@Composable
fun VariableQuantityDialog(
    produto: Produto,
    onConfirm: (Int) -> Unit,
    onCancel: () -> Unit
) {
    var quantityText by remember { mutableStateOf("1") }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    Dialog(
        onDismissRequest = onCancel,
        properties = DialogProperties(
            dismissOnBackPress = true,
            dismissOnClickOutside = false,
            usePlatformDefaultWidth = true
        )
    ) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            tonalElevation = 6.dp,
            color = MaterialTheme.colorScheme.surface,
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    imageVector = Icons.Default.QrCodeScanner,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(48.dp)
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Text(
                    text = "Quantidade Variável",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Text(
                    text = "O produto \"${produto.nome}\" exige digitação de quantidade.",
                    fontSize = 14.sp,
                    color = Color.Gray,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(20.dp))

                OutlinedTextField(
                    value = quantityText,
                    onValueChange = { input ->
                        if (input.all { it.isDigit() }) {
                            quantityText = input
                            errorMessage = null
                        }
                    },
                    label = { Text("Quantidade") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    isError = errorMessage != null,
                    textStyle = MaterialTheme.typography.headlineSmall.copy(
                        textAlign = TextAlign.Center,
                        fontWeight = FontWeight.Bold
                    ),
                    modifier = Modifier
                        .width(160.dp)
                        .testTag("qty_input")
                )

                if (errorMessage != null) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = errorMessage!!,
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 12.sp
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    TextButton(
                        onClick = onCancel,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Cancelar", color = Color.Gray)
                    }

                    Button(
                        onClick = {
                            val qty = quantityText.toIntOrNull()
                            if (qty == null || qty <= 0) {
                                errorMessage = "Mínimo 1 unidade!"
                            } else {
                                onConfirm(qty)
                            }
                        },
                        modifier = Modifier
                            .weight(1.2f)
                            .testTag("confirm_qty_button")
                    ) {
                        Text("Confirmar")
                    }
                }
            }
        }
    }
}

@Composable
fun CadastroScreen(viewModel: ScannerViewModel) {
    val produtos by viewModel.allProdutos.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    var isFormOpen by remember { mutableStateOf(false) }

    val filteredList = remember(produtos, searchQuery) {
        if (searchQuery.isBlank()) produtos else {
            produtos.filter {
                it.nome.contains(searchQuery, ignoreCase = true) ||
                it.codigoBarras.contains(searchQuery)
            }
        }
    }

    Scaffold(
        topBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF2B2930))
                    .statusBarsPadding()
                    .padding(horizontal = 16.dp, vertical = 14.dp)
            ) {
                Text(
                    text = "Simulador de Retaguarda",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White
                )
                Text(
                    text = "Gerenciamento e Cadastro de Produtos",
                    fontSize = 12.sp,
                    color = Color.White.copy(alpha = 0.7f)
                )
                
                Spacer(modifier = Modifier.height(12.dp))

                // Modern high-contrast Search Bar
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Buscar por nome ou código...", color = Color.White.copy(alpha = 0.5f)) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Color(0xFFD0BCFF)) },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { searchQuery = "" }) {
                                Icon(Icons.Default.Close, contentDescription = "Limpar busca", tint = Color.White)
                            }
                        }
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = Color(0xFF1D1B20),
                        unfocusedContainerColor = Color(0xFF1D1B20),
                        focusedBorderColor = Color(0xFFD0BCFF),
                        unfocusedBorderColor = Color.Transparent,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    ),
                    shape = RoundedCornerShape(28.dp),
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("search_bar")
                )
            }
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { isFormOpen = true },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary,
                modifier = Modifier.testTag("add_product_fab")
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(imageVector = Icons.Default.Add, contentDescription = "Novo Produto")
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Novo Produto", fontWeight = FontWeight.Bold)
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            if (filteredList.isEmpty()) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(32.dp),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.Storefront,
                        contentDescription = null,
                        tint = Color.LightGray,
                        modifier = Modifier.size(72.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Nenhum Produto Cadastredado",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.Gray
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = if (searchQuery.isBlank()) "Clique em 'Novo Produto' para adicionar o primeiro item ao banco local." else "Nenhum resultado corresponde à sua pesquisa.",
                        fontSize = 13.sp,
                        color = Color.Gray,
                        textAlign = TextAlign.Center
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    contentPadding = remember {
                        innerPadding // Add spacing to avoid FAB overlaps
                    }.let {
                        val fabSpacer = 88.dp
                        androidx.compose.foundation.layout.PaddingValues(
                            top = 12.dp,
                            start = 16.dp,
                            end = 16.dp,
                            bottom = fabSpacer
                        )
                    }
                ) {
                    items(filteredList, key = { it.id }) { produto ->
                        ProdutoItemCard(
                            produto = produto,
                            onDelete = { viewModel.excluirProduto(produto) }
                        )
                    }
                }
            }

            // Cadastro form dialog
            if (isFormOpen) {
                CadastroFormDialog(
                    onDismiss = { isFormOpen = false },
                    onSave = { code, name, price, unit, conversion, variableQty ->
                        viewModel.cadastrarProduto(
                            codigoBarras = code,
                            nome = name,
                            preco = price,
                            tipoUnidade = unit,
                            fatorConversao = conversion,
                            permiteQuantidadeVariavel = variableQty,
                            onSuccess = {
                                isFormOpen = false
                            },
                            onError = { error ->
                                // Custom form validation handles errors beautifully
                            }
                        )
                    }
                )
            }
        }
    }
}

@Composable
fun ProdutoItemCard(
    produto: Produto,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("produto_item_${produto.codigoBarras}"),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF2B2930)), // Deep Charcoal
        border = BorderStroke(1.dp, Color(0xFFE8DEF8).copy(alpha = 0.15f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = produto.nome,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(6.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        color = Color(0xFF6750A4), // Dark purple badge
                        shape = RoundedCornerShape(6.dp),
                        modifier = Modifier.padding(end = 8.dp)
                    ) {
                        Text(
                            text = produto.tipoUnidade,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                    Text(
                        text = "EAN: ${produto.codigoBarras}",
                        fontSize = 12.sp,
                        color = Color.White.copy(alpha = 0.6f),
                        fontFamily = FontFamily.Monospace
                    )
                }
                if (produto.permiteQuantidadeVariavel) {
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .background(Color(0xFFD0BCFF), CircleShape)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Quantidade variável exigida",
                            fontSize = 11.sp,
                            color = Color(0xFFD0BCFF),
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = String.format(Locale.US, "R$ %.2f", produto.preco),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFFD0BCFF) // Neon lavender accent
                )
                if (produto.fatorConversao > 1) {
                    Text(
                        text = "Fator: ${produto.fatorConversao}x",
                        fontSize = 11.sp,
                        color = Color.White.copy(alpha = 0.6f)
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                IconButton(
                    onClick = onDelete,
                    modifier = Modifier
                        .size(32.dp)
                        .testTag("delete_button_${produto.codigoBarras}")
                ) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Excluir produto",
                        tint = Color(0xFFEF4444).copy(alpha = 0.9f),
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}

// Custom Border class to avoid extra imports
@Composable
fun BorderStroke(width: Dp, color: Color) = remember(width, color) {
    androidx.compose.foundation.BorderStroke(width, color)
}

@Composable
fun CadastroFormDialog(
    onDismiss: () -> Unit,
    onSave: (code: String, name: String, price: Double, unit: String, conversion: Int, variableQty: Boolean) -> Unit
) {
    var codigoBarras by remember { mutableStateOf("") }
    var nome by remember { mutableStateOf("") }
    var preco by remember { mutableStateOf("") }
    var tipoUnidade by remember { mutableStateOf("UN") }
    var fatorConversao by remember { mutableStateOf("1") }
    var permiteQuantidadeVariavel by remember { mutableStateOf(false) }

    var isBarcodeReaderOpen by remember { mutableStateOf(false) }
    var errorText by remember { mutableStateOf<String?>(null) }
    val haptic = LocalHapticFeedback.current

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            dismissOnBackPress = true,
            dismissOnClickOutside = false,
            usePlatformDefaultWidth = true
        )
    ) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            tonalElevation = 6.dp,
            color = MaterialTheme.colorScheme.surface,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 4.dp, vertical = 16.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Cadastrar Produto",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    IconButton(onClick = onDismiss, modifier = Modifier.size(36.dp)) {
                        Icon(Icons.Default.Close, contentDescription = "Fechar")
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // "O TRUQUE DE USABILIDADE": Quick Code Scanner Modal Trigger
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = codigoBarras,
                        onValueChange = { codigoBarras = it },
                        label = { Text("Código de Barras (EAN)") },
                        singleLine = true,
                        placeholder = { Text("Bipe ou digite o código") },
                        modifier = Modifier
                            .weight(1f)
                            .testTag("form_barcode_input"),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    IconButton(
                        onClick = { isBarcodeReaderOpen = true },
                        modifier = Modifier
                            .size(54.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(MaterialTheme.colorScheme.primaryContainer)
                            .testTag("form_scanner_trigger")
                    ) {
                        Icon(
                            imageVector = Icons.Default.CameraAlt,
                            contentDescription = "Bipar com Câmera",
                            tint = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = nome,
                    onValueChange = { nome = it },
                    label = { Text("Nome do Produto") },
                    singleLine = true,
                    placeholder = { Text("Ex: Arroz 1kg") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("form_name_input")
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = preco,
                        onValueChange = { preco = it },
                        label = { Text("Preço (R$)") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        placeholder = { Text("0.00") },
                        modifier = Modifier
                            .weight(1f)
                            .testTag("form_price_input")
                    )

                    OutlinedTextField(
                        value = tipoUnidade,
                        onValueChange = { tipoUnidade = it },
                        label = { Text("Unidade") },
                        singleLine = true,
                        placeholder = { Text("UN, CX, FD") },
                        modifier = Modifier
                            .weight(0.8f)
                            .testTag("form_unit_input")
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = fatorConversao,
                    onValueChange = { fatorConversao = it },
                    label = { Text("Fator Conversão (ex: 12)") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("form_factor_input")
                )

                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                        .padding(horizontal = 14.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Quantidade Variável?",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                        Text(
                            text = "Solicita quantidade no bip",
                            fontSize = 11.sp,
                            color = Color.Gray
                        )
                    }
                    Switch(
                        checked = permiteQuantidadeVariavel,
                        onCheckedChange = { permiteQuantidadeVariavel = it },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = MaterialTheme.colorScheme.primary,
                            checkedTrackColor = MaterialTheme.colorScheme.primaryContainer
                        ),
                        modifier = Modifier.testTag("form_variable_switch")
                    )
                }

                if (errorText != null) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = errorText!!,
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    TextButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Cancelar", color = Color.Gray)
                    }

                    Button(
                        onClick = {
                            val prc = preco.toDoubleOrNull()
                            val fat = fatorConversao.toIntOrNull() ?: 1
                            if (codigoBarras.isBlank() || nome.isBlank() || prc == null) {
                                errorText = "Preencha todos os campos corretamente!"
                            } else {
                                onSave(codigoBarras, nome, prc, tipoUnidade, fat, permiteQuantidadeVariavel)
                            }
                        },
                        modifier = Modifier
                            .weight(1.2f)
                            .testTag("form_submit_button")
                    ) {
                        Text("Salvar")
                    }
                }
            }
        }
    }

    // Modal Camera scanner for the registration form ("O Truque de Usabilidade")
    if (isBarcodeReaderOpen) {
        QuickCameraScannerModal(
            onBarcodeScanned = { code ->
                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                codigoBarras = code
                isBarcodeReaderOpen = false
            },
            onDismiss = { isBarcodeReaderOpen = false }
        )
    }
}

@Composable
fun QuickCameraScannerModal(
    onBarcodeScanned: (String) -> Unit,
    onDismiss: () -> Unit
) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            usePlatformDefaultWidth = false
        )
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.9f)
                .fillMaxHeight(0.6f)
                .clip(RoundedCornerShape(24.dp)),
            color = Color.Black
        ) {
            Box(modifier = Modifier.fillMaxSize()) {
                CameraPreviewView(
                    isLocked = false,
                    onBarcodeDetected = { barcode ->
                        onBarcodeScanned(barcode)
                    },
                    modifier = Modifier.fillMaxSize()
                )

                // Rectangular barcode guide frame overlay
                ScannerOverlayGuide()

                // Bottom actions
                IconButton(
                    onClick = onDismiss,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(16.dp)
                        .background(Color.Black.copy(alpha = 0.6f), CircleShape)
                ) {
                    Icon(Icons.Default.Close, contentDescription = "Fechar Scanner", tint = Color.White)
                }

                Text(
                    text = "Aponte para o código de barras",
                    color = Color.White,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(24.dp)
                        .background(Color.Black.copy(alpha = 0.7f), RoundedCornerShape(12.dp))
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                )
            }
        }
    }
}
