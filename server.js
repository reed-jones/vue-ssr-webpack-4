// ******************************
// Dependencies
// ******************************

// The best async web server module for Node.js.
import Koa from 'koa'
import serve from 'koa-static';


// Core module - allows us to obtain absolute paths.
import path from 'path'

// Performs the heavy lifting with regards to Vue server-side rendering. Takes the
// vue-ssr-server-bundle.json file generated by Webpack, as well as an HTML template and a client
// manifest, and generates webpages.
import { createBundleRenderer } from 'vue-server-renderer'

// In this context, Webpack will be acting as a compiler.
// Learn more here: https://webpack.js.org/api/node/
import Webpack from 'webpack'

// The webpack-dev-middleware confused the hell out of me. But it's neat. As its name implies, it helps our
// our development workflow in a couple ways:
//
//  - It hooks itself into Koa and serves files generated by Webpack in-memory. This doesn't
//    really matter in production, but while we're developing Webpack is constantly emitting new
//    bundles, HMR manifests, and other odds-and-ends. This can really eat up disk space over time
//    if you forget to clear said files out.
//  - It handles kicking-off Webpack compilation whenever files changes specified in your Webpack
//    config change. The zero-config aspect of this is nice, but it's also a bit magical.
//
// Learn more here: https://github.com/webpack/webpack-dev-middleware

// The webpack-hot-middleware listens to any changes in the files specified in our Webpack configuration and
// creates `hot-update` bundles which can be sent to the browser and instantly update what you see.
// Holy smokes, when it works it's great but it's a boojum if it doesn't.
//
// Learn more here: https://github.com/webpack-contrib/webpack-hot-middleware
import { koaDevMiddleware, koaHotMiddleware } from './hmr'

// We import our Webpack configuration here as separate web and server targets.
// This is important later, when we need to spool up webpack-dev-middleware and server
// watchers separately.
// import { ssrConfig, webConfig } from './webpack.config'
import WebpackServerConfig from './build/webpack.server.config'
import WebpackWebConfig from './build/webpack.client.config'

//******************************
// Basic Initialization
//******************************

const app = new Koa()

const {
  NODE_ENV = 'production',
  PORT = 3000
} = process.env

const isProduction = NODE_ENV === 'production'


let renderer = null

//******************************
// Renderer Generator
//******************************

// In the context of this file, the "renderer" is responsible for taking the assets generated by the
// Vue SSR Webpack plugins and rendering HTML from them. This function does do much more than look
// in the expected places for said assets, but there is oddity: the fact that this function
// accepts an `fs` interface, though it defaults to Node's core filesystem module
//
// The rationale here is that we actually use different filesystem between development and
// and production. In development, all generated assets are actually held in memory via
// webpack-dev-middleware. As its middleware, Koa has easy access to these files i
// (via the Koa.static call below), but other callers need to find a different means in.
// Thankfully, an instance of webpack-dev-middleware exposes its `memory-fs` instance via the
// `fileSystem` property, which we can then pass to this function to all it access to the in-memory
// resources it needs, such as the server bundle and client manifest.
//
// Note also that we always load the HTML template from the disk, as it's not a part of the Webpack
// compilation process.
//
// You can learn more about bundle rendering here: https://ssr.vuejs.org/en/bundle-renderer.html
const generateRenderer = (fs) => {
  if (!fs) fs = require('fs')

  const serverBundlePath = path.resolve(__dirname, './public/vue-ssr-server-bundle.json')
  const clientBundlePath = path.resolve(__dirname, './public/vue-ssr-client-manifest.json')
  const templatePath = path.resolve(__dirname, './index.template.html')

  return createBundleRenderer(
    JSON.parse(fs.readFileSync(serverBundlePath, 'utf-8')),
    {
      clientManifest: JSON.parse(fs.readFileSync(clientBundlePath, 'utf-8')),
      // Always read the HTML template from the filesystem.
      runInNewContext: false,
      template: require('fs').readFileSync(templatePath, 'utf-8')
    }
  )
}

// If we're in production, assume that `webpack` has already been run and we're ready to load
// the necessary resources directly from the file system. Otherwise, spool up
// webpack-dev-middleware and load all assets directly into memory.
if (isProduction) {
  renderer = generateRenderer()
} else {
  const webCompiler = Webpack(WebpackWebConfig)
  const serverCompiler = Webpack(WebpackServerConfig)

  // Take a look at my notes in the "Dependencies" section above for why we use this.
  // The `publicPath` property here ensure that the path which Webpack outputs its assets
  // is the same that this middleware serves from.
  // Only configuration is to turn off logging.


  // Ordering here is important! Make sure that the dev middleware has a chance to clobber
  // the Koa filesystem before hot middleware starts reading from it.
  const devMiddleware = koaDevMiddleware(webCompiler, {
    noInfo: true,
    quiet: true,
    stats: 'errors-only'
  })

  const hotMiddleware = koaHotMiddleware(webCompiler, {
    path: '/__webpack_hmr',
    heartbeat: 10 * 1000,
    log: () => { }, // disable logging
    noInfo: true,
    quiet: true,
    stats: 'errors-only'
  })

  app.use(devMiddleware)
  app.use(hotMiddleware)

  // This one's fun. So if you've followed along above you know that webpack-dev-middleware
  // allows us to serve Webpack assets in-memory. Neat! But it only concerns itself with assets
  // that make their way to the client, which is the norm for most non-SSR Webpack setups.
  // But in our case there are two Webpack compiler processes that we care about:
  //
  //  - The _web_ compiler, which we pass to webpack-dev-middleware and which said middleware
  //    takes over by kicking off `watch`, etc...
  //  - The _server_ compiler, which we manage directly below, and which takes care of regenerating
  //    the server bundle whenever assets change.
  //
  // The issue here is that, with the line just below, the two compiler would be talking to two
  // completely different filesystem. By assigning the webpack-dev-middleware instance of `memory-fs`
  // to our serverCompiler's `outputFileSystem` property, we can ensure they both write to the same
  // place.
  serverCompiler.outputFileSystem = devMiddleware.fileSystem

  // // Just a convenience hook for showing nice console messages that refresh the terminal.
  webCompiler.hooks.beforeCompile.tap('Console Rest', () => {
    console.clear()
    console.info('Recompiling assets...')
  })

  // The webpack-dev-middleware will automatically build the assets for our web compiler.
  // Thus, we don't need to call `watch` on the above webCompiler. We do, however, need to
  // call watch our serverCompiler to ensure that both the server and client stay in sync.
  //
  // We use the `afterEmit` hook here to ensure that, when we call our server compiler, all
  // client-side resources will be ready to load into the bundle renderer.
  webCompiler.hooks.afterEmit.tap('Web Compilation', (stats) => {
    console.clear()
    console.time('\nCompilation Time')

    console.info(`*** WEB COMPILATION COMPLETE ***\n`)
    console.group('Generated Assets')
    Object.keys(stats.assets).forEach(a => console.info(a))
    console.groupEnd()

    serverCompiler.run((err, stats) => {
      console.info(`\n*** SERVER COMPILATION COMPLETE *** \n`)
      console.group('Generated Assets')
      Object.keys(stats.compilation.assets).forEach(a => console.info(a))
      console.groupEnd()

      renderer = generateRenderer(devMiddleware.fileSystem)
      console.timeEnd('\nCompilation Time')
    })
  })
}

//******************************
// Static Resource Serving
//******************************

// As mentioned above, it is crucial to understand that webpack-dev-middleware hijacks this
// in development, and will serve assets directly from memory that are requested at this path.
// In production, assets will be served directly from the file system.
app.use(serve(__dirname + '/public'))

//******************************
// Catch-all Route
//******************************

// Because we delegate to Vue Router to determine if a particular route is serve-able,
// at the Koa level we simply implement a catch-all.
app.use(async (ctx, next) => {
  // await Promise.all([renderer])

  // In development, the renderer might take a second to generate.
  if (!renderer) {
    ctx.status = 500
    ctx.body = 'Renderer is being created, one moment please....'
    return
  }

  // And here we arrive. Our Vue Server Renderer instance takes a single `context` object,
  // which (since we're on the server) gets passed directly to `entry-server.js`. If the Vue
  // app isn't able to find a matching route, it will pass back an error.
  try {
    ctx.body = await renderer.renderToString({ url: ctx.request.url })
  } catch (err) {
    ctx.status = 404
    ctx.body = 'Could not find page...'
  }
})

// Liftoff!
app.listen(PORT, _ => {
  console.log(`App is now listening at http://localhost:${PORT}`)
})

export default app
