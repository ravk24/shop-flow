const base = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { InventoryPage } = require('../pages/InventoryPage');
const { ProductDetailPage } = require('../pages/ProductDetailPage');
const { CartPage } = require('../pages/CartPage');
const { CheckoutOverviewPage } = require('../pages/CheckoutOverviewPage');

exports.test = base.test.extend({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  productDetailPage: async ({ page }, use) => use(new ProductDetailPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutOverviewPage: async ({ page }, use) => use(new CheckoutOverviewPage(page)),
});
exports.expect = base.expect;
