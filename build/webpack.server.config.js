// ******************************
// Dependencies
// ******************************

// Takes our *.vue files and other web assets and bundles them.
import Webpack from 'webpack'

// Allows us to intelligently merge Webpack configuration objects.
import WebpackMerge from 'webpack-merge'

// Allows us to exclude Node.js dependencies from the built server bundle, making build times
// much, much faster.
import WebpackNodeExternals from 'webpack-node-externals'

// Beyond Webpack and Vue itself, this one of the most important dependencies. The Vue SSR server
// plugin generates a `server-manifest` which is used instruct the rendering engine exactly what to
// return when a web request is made. But again, the internals of this plugin are a mystery to me
// as well.
import VueSSRServerPlugin from 'vue-server-renderer/server-plugin'

// Base webpack config to be merged with
import baseConfig from './webpack.base.config'

// ****************************************
// Server-Side Webpack Configuration
// ****************************************

const serverConfig = WebpackMerge(baseConfig, {
  target: 'node',

  entry: [
    '@/entry-server.js'
  ],

  // Here we whitelist only those Node.js modules which are necessary for rendering our app.
  // Including any other modules in the server bundle slows build time and is unnecessary.
  externals: WebpackNodeExternals({
    whitelist: ['axios', 'vue', 'vue-router', 'vuex']
  }),

  output: {
    // Result in the compiled module being exposed as `module.exports = ...`.
    // See https://webpack.js.org/configuration/output/#module-definition-systems
    libraryTarget: 'commonjs2'
  },

  plugins: [
    new VueSSRServerPlugin(),
    new Webpack.DefinePlugin({
      'process.env.VUE_ENV': 'server'
    })
  ],
})

export default serverConfig
