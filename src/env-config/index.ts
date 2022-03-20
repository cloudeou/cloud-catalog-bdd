const bddEnv = process.env.bddEnv || "prod";
export const { envConfig } = require(`./${bddEnv}`);
