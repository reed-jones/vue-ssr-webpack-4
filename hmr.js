import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import { PassThrough } from 'stream'

export const koaDevMiddleware = (webpackCompiler, options) => {
    const expressStyled = webpackDevMiddleware(webpackCompiler, options)
    const koaStyled = async (ctx, next) => {
        await expressStyled(ctx.req, {
            end: (content) => {
                ctx.body = content
            },
            setHeader: (name, value) => {
                ctx.set(name, value)
            },
            locals: ctx.state,
        }, next)
    }

    koaStyled.fileSystem = expressStyled.fileSystem
    koaStyled.close = expressStyled.close
    koaStyled.invalidate = expressStyled.invalidate
    koaStyled.waitUntilInvalid = expressStyled.waitUntilInvalid
    return koaStyled
}

export const koaHotMiddleware = (webpackCompiler, options) => {
    const expressStyled = webpackHotMiddleware(webpackCompiler, options);
    return async (ctx, next) => {
        const stream = new PassThrough()
        await expressStyled(ctx.req, {
            write: stream.write.bind(stream),
            writeHead: (status, headers) => {
                ctx.body = stream
                ctx.status = status
                ctx.set(headers)
            },
            end: (content) => {
                ctx.body = content;
            },
        }, next)
    }
}
