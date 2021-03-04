const Koa = require('koa')
const Router = require('@koa/router')
const redis = require('redis')
const views = require('koa-views')
const { promisify } = require('util')
const path = require('path')
const app = new Koa()
const router = new Router()

// defaults to localhost and default redis port 6379
// const client = redis.createClient()

// this is an example of using an elasticache cluster with tls
// const client = redis.createClient({
//   host: 'master.test.7ybrx5.use1.cache.amazonaws.com',
//   port: '6379',
//   password: 'somereallylongpasswordwithspecialcharachters!',
//   tls: {}
// })

// and this will connect to the redis defined in docker-compose
const client = redis.createClient({
  host: 'redis',
  port: 6379
})

const get = promisify(client.get).bind(client)
const set = promisify(client.set).bind(client)

const render = views(path.join(__dirname, 'views'), {
  map: {
    html: 'mustache'
  }
})

app.use(render)

router.get('/', async (ctx) => {
  try {
    const things = (await get('things') || 1)
    await ctx.render('index', {
      test: 'hello world from mustache templates',
      things
    })
    await set('things', (parseInt(things) + 1))
    return
  } catch (err) {
    ctx.body = err.message
  }
})

router.get('/test', async (ctx) => {
  ctx.body = 'hi'
})

app.use(router.routes())
app.use(router.allowedMethods())

const server = app.listen('80', '0.0.0.0', async () => {
  console.log('listening on 80')
})

process.on('SIGINT', () => {
  console.info('SIGINT signal received. Server shutting down')
  server.close(() => {
    console.log('server shut down gracefully')
    process.exit(0)
  })
})

process.on('SIGTERM', () => {
  console.info('SIGTERM signal received. Server shutting down')
  server.close(() => {
    console.log('server shut down gracefully')
    process.exit(0)
  })
})
