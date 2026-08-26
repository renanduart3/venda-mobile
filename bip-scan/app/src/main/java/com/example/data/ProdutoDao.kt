package com.example.data

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface ProdutoDao {
    @Query("SELECT * FROM produtos ORDER BY id DESC")
    fun getAllProdutos(): Flow<List<Produto>>

    @Query("SELECT * FROM produtos WHERE codigoBarras = :codigo LIMIT 1")
    suspend fun getProdutoByCodigo(codigo: String): Produto?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProduto(produto: Produto): Long

    @Delete
    suspend fun deleteProduto(produto: Produto)
}
