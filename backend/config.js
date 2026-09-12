const DEFAULT_CLIENT_ORIGINS = ["http://localhost:5173"];

const getAllowedOrigins = (env = process.env) => {
  const rawOrigins = env.CLIENT_ORIGINS;

  if (!rawOrigins) {
    return DEFAULT_CLIENT_ORIGINS;
  }

  const origins = rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : DEFAULT_CLIENT_ORIGINS;
};

module.exports = {
  getAllowedOrigins,
};
