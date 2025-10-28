/**
 * Centralized data loading utilities to avoid code duplication
 */

import { USE_MOCKS, mockProducts, mockCustomers, mockSales, mockExpenses, mockDashboardStats } from './mocks';

/**
 * Generic data loader that handles mock vs real data
 */
async function loadData<T>(mockData: T, realDataLoader?: () => Promise<T>): Promise<T> {
  if (USE_MOCKS) {
    return mockData;
  }
  
  if (realDataLoader) {
    return await realDataLoader();
  }
  
  // Return empty array or default value for the type
  return (Array.isArray(mockData) ? [] : {}) as T;
}

/**
 * Load products from mock or database
 */
export async function loadProducts() {
  return loadData(mockProducts);
}

/**
 * Load customers from mock or database
 */
export async function loadCustomers() {
  return loadData(mockCustomers);
}

/**
 * Load sales from mock or database
 */
export async function loadSales() {
  return loadData(mockSales);
}

/**
 * Load expenses from mock or database
 */
export async function loadExpenses() {
  return loadData(mockExpenses);
}

/**
 * Load dashboard stats from mock or database
 */
export async function loadDashboardStats() {
  return loadData(mockDashboardStats);
}
