class BasePage {
  constructor(page) {
    this.page = page;
  }

  async goto(path) {
    await this.page.goto(path);
  }

  async reload() {
    await this.page.reload();
  }
}

module.exports = { BasePage };
