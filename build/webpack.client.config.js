// ******************************
// Dependencies
// ******************************

// Takes our *.vue files and other web assets and bundles them.
import Webpack from 'webpack'

// Allows us to intelligently merge Webpack configuration objects.
import WebpackMerge from 'webpack-merge'

// The Vue SSR client plugin generates a `client-manifest` which allows Vue to make better decisions
// about how and what to render client-side, but TBH it's all a mystery to me.
import VueSSRClientPlugin from 'vue-server-renderer/client-plugin'

// Base webpack config to be merged with
import baseConfig from './webpack.base.config'

// ******************************
// Convenience Utils
// ******************************

const isProduction = process.env.NODE_ENV === 'production'

// ****************************************
// Client-Side Webpack Configuration
// ****************************************

const clientConfig = WebpackMerge(baseConfig, {
  target: 'web',

  devtool: isProduction ? false : 'source-map',

  entry: [
    '@/entry-client.js'
  ],

  plugins: [
    new VueSSRClientPlugin(),
    new Webpack.DefinePlugin({
      'process.env.VUE_ENV': 'client'
    })
  ]
})

// In development, we want to instantly update the client if we make a change to the Vue app.
// The webpack-hot-middleware plugin let's us do just that, and here we add the necessary elements
// to the above `web` config if we're running in development mode.
if (!isProduction) {
  clientConfig.entry.unshift('webpack-hot-middleware/client?quiet=true&noInfo=true&reload=true')
  clientConfig.plugins.push(new Webpack.HotModuleReplacementPlugin())
  clientConfig.plugins.push(new Webpack.NoEmitOnErrorsPlugin())
}

export default clientConfig
