const path = require("path");

// the version the build reports, so an installed app can tell whether a live update is newer
process.env.REACT_APP_VERSION = require("./package.json").version;

module.exports = function override(config) {
  config.resolve.alias["@"] = path.resolve(__dirname, "src");
  return config;
};
