const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

const mfConfig = withModuleFederationPlugin({
  remotes: {
    'clientesfront': 'clientesfront@http://localhost:4201/remoteEntry.js',
    'almacenfront':  'almacenfront@http://localhost:4202/remoteEntry.js',
  },
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
