package com.example.data

import kotlinx.coroutines.flow.Flow

class ProdutoRepository(private val produtoDao: ProdutoDao) {
    val allProdutos: Flow<List<Produto>> = produtoDao.getAllProdutos()

    suspend fun getProdutoByCodigo(codigo: String): Produto? {
        return produtoDao.getProdutoByCodigo(codigo)
    }

    suspend fun insertProduto(produto: Produto): Long {
        return produtoDao.insertProduto(produto)
    }

    suspend fun deleteProduto(produto: Produto) {
        produtoDao.deleteProduto(produto)
    }
}
