// Allure 3 (Node, no Java). Each `allure generate` appends one entry to the history file, which drives the trend charts.
export default {
  name: 'ShopFlow',
  output: './allure-report',
  historyPath: './allure-history/history.jsonl',
  plugins: {
    awesome: { options: { singleFile: true } },
  },
};
