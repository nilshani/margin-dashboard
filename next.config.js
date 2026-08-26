/** @type {import('next').NextConfig} */

// Node 25 exposes localStorage globally but without --localstorage-file it's broken.
// Patch it out so server-side code that checks typeof localStorage !== 'undefined' works correctly.
if (typeof localStorage !== "undefined" && typeof localStorage.getItem !== "function") {
  // @ts-ignore
  globalThis.localStorage = undefined;
}

module.exports = {
  serverExternalPackages: ["node:sqlite"],
  devIndicators: false,
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), "node:sqlite"];
    }
    return config;
  },
};
