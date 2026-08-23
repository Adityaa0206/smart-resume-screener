import { createApp } from "./app";
import { config, isDemoMode } from "./config";
import { logger } from "./utils/logger";

const app = createApp();

app.listen(config.port, () => {
  logger.info(`Smart Resume Screener backend listening on port ${config.port}`, {
    nodeEnv: config.nodeEnv,
    llmMode: isDemoMode() ? "demo" : "live"
  });
});
