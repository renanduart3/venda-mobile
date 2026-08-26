package com.example.ui

import android.app.Application
import android.os.SystemClock
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.AppDatabase
import com.example.data.Produto
import com.example.data.ProdutoRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

sealed interface ScanResult {
    object Idle : ScanResult
    data class Success(val produto: Produto, val quantidade: Int? = null, val totalCalculado: Double? = null) : ScanResult
    data class SuccessVariableQtyRequired(val produto: Produto) : ScanResult
    data class NotFound(val barcode: String) : ScanResult
}

data class ScannerUiState(
    val scanResult: ScanResult = ScanResult.Idle,
    val isScanningLocked: Boolean = false,
    val lastScannedBarcode: String? = null,
    val infoMessage: String? = null
)

class ScannerViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: ProdutoRepository
    val allProdutos: StateFlow<List<Produto>>

    private val _uiState = MutableStateFlow(ScannerUiState())
    val uiState: StateFlow<ScannerUiState> = _uiState.asStateFlow()

    // Control scanning cooldown
    private var cooldownJob: Job? = null
    private var dismissJob: Job? = null
    private var lastScanTime: Long = 0
    private val COOLDOWN_MS = 2000L

    init {
        val database = AppDatabase.getDatabase(application)
        repository = ProdutoRepository(database.produtoDao())
        allProdutos = repository.allProdutos
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5000),
                initialValue = emptyList()
            )

        // Seed initial mock products if database is empty so the user can test immediately!
        viewModelScope.launch {
            repository.allProdutos.collect { list ->
                if (list.isEmpty()) {
                    seedDefaultProducts()
                }
            }
        }
    }

    private suspend fun seedDefaultProducts() {
        val defaults = listOf(
            Produto(
                codigoBarras = "7891010101010",
                nome = "Café Tradicional Gourmet 500g",
                preco = 18.90,
                tipoUnidade = "UN",
                fatorConversao = 1,
                permiteQuantidadeVariavel = false
            ),
            Produto(
                codigoBarras = "7891000123456",
                nome = "Arroz Tipo 1 Saco 5kg",
                preco = 29.90,
                tipoUnidade = "UN",
                fatorConversao = 1,
                permiteQuantidadeVariavel = false
            ),
            Produto(
                codigoBarras = "7894900011517",
                nome = "Refrigerante Coca-Cola 2L",
                preco = 8.50,
                tipoUnidade = "UN",
                fatorConversao = 1,
                permiteQuantidadeVariavel = false
            ),
            Produto(
                codigoBarras = "7891020304050",
                nome = "Tomate Italiano Inteiro kg (Granel)",
                preco = 7.99,
                tipoUnidade = "KG",
                fatorConversao = 1,
                permiteQuantidadeVariavel = true // Variable quantity!
            ),
            Produto(
                codigoBarras = "123456",
                nome = "Fardo de Água Mineral 12x500ml",
                preco = 15.00,
                tipoUnidade = "FD",
                fatorConversao = 12,
                permiteQuantidadeVariavel = false
            )
        )
        for (p in defaults) {
            repository.insertProduto(p)
        }
    }

    fun onBarcodeScanned(barcode: String, onHapticFeedback: () -> Unit) {
        val currentTime = SystemClock.elapsedRealtime()
        
        // Cooldown and Scan Lock check to prevent double scans
        if (_uiState.value.isScanningLocked || (currentTime - lastScanTime) < COOLDOWN_MS) {
            return
        }

        // Lock and trigger haptic feedback
        _uiState.update { it.copy(isScanningLocked = true, lastScannedBarcode = barcode) }
        lastScanTime = currentTime
        onHapticFeedback()

        viewModelScope.launch {
            val produto = repository.getProdutoByCodigo(barcode)
            if (produto != null) {
                if (produto.permiteQuantidadeVariavel) {
                    // Requires variable quantity entry -> Show bottom sheet / popup dialog
                    _uiState.update { it.copy(scanResult = ScanResult.SuccessVariableQtyRequired(produto)) }
                    // We DO NOT release the scan lock yet, as the user needs to enter the quantity first.
                } else {
                    // Regular product -> Show card at bottom with auto-dismiss
                    _uiState.update { 
                        it.copy(
                            scanResult = ScanResult.Success(produto),
                            infoMessage = "Produto bipado com sucesso!"
                        ) 
                    }
                    startDismissTimer()
                    startCooldownTimer()
                }
            } else {
                // Product not found in local db
                _uiState.update { 
                    it.copy(
                        scanResult = ScanResult.NotFound(barcode),
                        infoMessage = "Produto não cadastrado!"
                    ) 
                }
                startDismissTimer()
                startCooldownTimer()
            }
        }
    }

    fun confirmVariableQuantity(quantidade: Int) {
        val state = _uiState.value
        val result = state.scanResult
        if (result is ScanResult.SuccessVariableQtyRequired) {
            val produto = result.produto
            val total = produto.preco * quantidade
            _uiState.update {
                it.copy(
                    scanResult = ScanResult.Success(produto, quantidade, total),
                    infoMessage = "$quantidade x ${produto.nome} adicionado!"
                )
            }
            startDismissTimer()
            startCooldownTimer()
        }
    }

    fun cancelVariableQuantity() {
        resetScanState()
    }

    fun resetScanState() {
        dismissJob?.cancel()
        cooldownJob?.cancel()
        _uiState.update {
            it.copy(
                scanResult = ScanResult.Idle,
                isScanningLocked = false,
                lastScannedBarcode = null,
                infoMessage = null
            )
        }
    }

    private fun startDismissTimer() {
        dismissJob?.cancel()
        dismissJob = viewModelScope.launch {
            delay(3000) // Card stays visible for 3 seconds, then vanishes
            _uiState.update {
                if (it.scanResult !is ScanResult.SuccessVariableQtyRequired) {
                    it.copy(scanResult = ScanResult.Idle, infoMessage = null)
                } else {
                    it
                }
            }
        }
    }

    private fun startCooldownTimer() {
        cooldownJob?.cancel()
        cooldownJob = viewModelScope.launch {
            delay(COOLDOWN_MS)
            _uiState.update { it.copy(isScanningLocked = false) }
        }
    }

    fun cadastrarProduto(
        codigoBarras: String,
        nome: String,
        preco: Double,
        tipoUnidade: String,
        fatorConversao: Int,
        permiteQuantidadeVariavel: Boolean,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        if (codigoBarras.isBlank() || nome.isBlank()) {
            onError("Código de barras e nome são obrigatórios!")
            return
        }
        if (preco <= 0.0) {
            onError("O preço deve ser maior que zero!")
            return
        }

        viewModelScope.launch {
            try {
                val produto = Produto(
                    codigoBarras = codigoBarras.trim(),
                    nome = nome.trim(),
                    preco = preco,
                    tipoUnidade = tipoUnidade.trim().uppercase(),
                    fatorConversao = if (fatorConversao <= 0) 1 else fatorConversao,
                    permiteQuantidadeVariavel = permiteQuantidadeVariavel
                )
                repository.insertProduto(produto)
                onSuccess()
            } catch (e: Exception) {
                onError("Erro ao salvar produto: ${e.message}")
            }
        }
    }

    fun excluirProduto(produto: Produto) {
        viewModelScope.launch {
            repository.deleteProduto(produto)
        }
    }
}
