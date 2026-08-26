package com.example.data

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "produtos",
    indices = [Index(value = ["codigoBarras"], unique = true)]
)
data class Produto(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val codigoBarras: String,
    val nome: String,
    val preco: Double,
    val tipoUnidade: String, // 'UN' (Unidade), 'CX' (Caixa), 'FD' (Fardo)
    val fatorConversao: Int, // 1 para UN, 12 para CX com 12 itens, etc.
    val permiteQuantidadeVariavel: Boolean
)
