/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  const { discount, sale_price, quantity } = purchase;
  const discountDecimal = discount / 100;
  const fullPrice = sale_price * quantity;
  return fullPrice * (1 - discountDecimal);
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  const { profit } = seller;

  if (index === 0) {
    return profit * 0.15;
  }
  if (index === 1 || index === 2) {
    return profit * 0.1;
  }
  if (index === total - 1) {
    return 0;
  }
  return profit * 0.05;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных
  if (!data || !data.sellers || !data.products || !data.purchase_records) {
    throw new Error(
      "Переданы не все данные: нужны sellers, products и purchase_records",
    );
  }
  if (!Array.isArray(data.sellers) || data.sellers.length === 0) {
    throw new Error("Список продавцов пуст или не является массивом");
  }
  if (!Array.isArray(data.products) || data.products.length === 0) {
    throw new Error("Список товаров пуст или не является массивом");
  }
  if (
    !Array.isArray(data.purchase_records) ||
    data.purchase_records.length === 0
  ) {
    throw new Error("Список продаж пуст или не является массивом");
  }
  // @TODO: Проверка наличия опций
  const { calculateRevenue, calculateBonus } = options;
  if (
    typeof calculateRevenue !== "function" ||
    typeof calculateBonus !== "function"
  ) {
    throw new Error("Не переданы функции для расчёта выручки и бонусов");
  }
  // @TODO: Подготовка промежуточных данных для сбора статистики
  const createSellerStats = (seller) => ({
    seller_id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
  });
  // @TODO: Индексация продавцов и товаров для быстрого доступа
  const sellersMap = new Map();
  data.sellers.forEach((seller) => {
    sellersMap.set(seller.id, createSellerStats(seller));
  });
  const productsMap = new Map();
  data.products.forEach((product) => {
    productsMap.set(product.sku, product);
  });
  // @TODO: Расчет выручки и прибыли для каждого продавца
  data.purchase_records.forEach((record) => {
    const sellerStats = sellersMap.get(record.seller_id);
    if (!sellerStats) return;

    sellerStats.sales_count += 1;

    record.items.forEach((item) => {
      const product = productsMap.get(item.sku);
      if (!product) return;

      const revenue = calculateRevenue(item, product);
      const cost = product.purchase_price * item.quantity;
      const profit = revenue - cost;

      sellerStats.revenue += revenue;
      sellerStats.profit += profit;

      if (!sellerStats.products_sold[item.sku]) {
        sellerStats.products_sold[item.sku] = 0;
      }
      sellerStats.products_sold[item.sku] += item.quantity;
    });
  });

  // @TODO: Сортировка продавцов по прибыли
  const sellersArray = Array.from(sellersMap.values());
  sellersArray.sort((a, b) => b.profit - a.profit);
  // @TODO: Назначение премий на основе ранжирования
  sellersArray.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, sellersArray.length, seller);
  });
  // @TODO: Подготовка итоговой коллекции с нужными полями
  return sellersArray.map((seller) => ({
    seller_id: seller.seller_id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products: seller.top_products || [],
    bonus: +seller.bonus.toFixed(2),
  }));
}
