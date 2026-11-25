
import app from "./app.js";

const PORT = process.env.API_PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ShopSphere backend running on port ${PORT}`);
});
