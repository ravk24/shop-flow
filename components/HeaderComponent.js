// Shared header: cart link/badge and burger menu. Not a page, so it does not extend BasePage.
class HeaderComponent {
  constructor(page) {
    this.page = page;
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.menuButton = page.getByRole('button', { name: 'Open Menu' });
    this.closeMenuButton = page.getByRole('button', { name: 'Close Menu' });
    this.allItemsLink = page.getByTestId('inventory-sidebar-link');
    this.logoutLink = page.getByTestId('logout-sidebar-link');
    this.resetLink = page.getByTestId('reset-sidebar-link');
  }

  async openCart() {
    await this.cartLink.click();
  }

  async openMenu() {
    // The app hides the menu shortly after load. A click just before that leaves it open but not displayed.
    await this.logoutLink.waitFor({ state: 'hidden' });
    await this.menuButton.click();
  }

  async logout() {
    await this.openMenu();
    await this.logoutLink.click();
  }
}

module.exports = { HeaderComponent };
