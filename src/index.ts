import "dotenv/config";
import app from "./app";

const PORT = Number(process.env.PORT) || 3000;
const ENV = process.env.NODE_ENV ?? "development";

app.listen(PORT, () => {
  console.log(
    `\x1b[36m✓ Server running\x1b[0m on http://localhost:${PORT} [\x1b[33m${ENV}\x1b[0m]`,
  );
});
