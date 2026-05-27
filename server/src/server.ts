import "dotenv/config";

import app from "./app.ts";
import { connectDatabase } from "./utils/database.ts";

const port = process.env.PORT ?? "4000";

await connectDatabase();

app.listen(port, () => {
  console.log(`Dev Server: http://localhost:${port}`);
});
