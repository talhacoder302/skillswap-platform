exports.logInfo = (message) => {
  console.log(`ℹ️ ${message}`);
};

exports.logSuccess = (message) => {
  console.log(`✅ ${message}`);
};

exports.logWarning = (message) => {
  console.warn(`⚠️ ${message}`);
};

exports.logError = (error) => {
  console.error("❌ ERROR");

  console.error(error);
};
