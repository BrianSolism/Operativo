const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

const mfConfig = withModuleFederationPlugin({
  remotes: {},
  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
});

module.exports = {
  ...mfConfig,
  watchOptions: {
    aggregateTimeout: 1000,
    poll: 3000,
    ignored: ['**/node_modules/**', '**/dist/**'],
  },
};
