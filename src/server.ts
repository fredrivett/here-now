import { createApp } from './app';

const app = createApp();
const port = process.env.PORT || 3210;

app.listen(port, () => {
  console.log(`🚀 here/now API server running on port ${port}`);
  console.log(`📊 Widget available at: http://localhost:${port}/widget.js`);
  console.log(`💻 API docs: http://localhost:${port}`);
});
