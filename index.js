const swaggerUi = require('swagger-ui-express')
let swaggerOnly = process.argv.includes('--swagger-only')
let puppeteer
try {
    puppeteer = swaggerOnly ? {
        launch: (...args) => {
            log('[PuPsIm]', ...args)
            return {
                newPage: (...args) => {
                    log('[PuPsIm]', ...args)
                    return {
                        goto: (...args) => log('[PuPsIm]', ...args),
                        screenshot: (...args) => log('[PuPsIm]', ...args),
                        evaluate: (...args) => log('[PuPsIm]', ...args),
                        on: (...args) => log('[PuPsIm]', ...args)
                    }
                },
                close: () => {}
            }
        }
    } : require('puppeteer')
} catch (e) {
    console.log("\033[31mTry adding '--swagger-only' option for testing or 'npm install puppeteer' instead\033[0m", e)
}
const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const CONSTANT = {
    mimetype: {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        webp: 'image/webp',
        'image/png': 'image/png',
        'image/jpg': 'image/jpeg',
        'image/jpeg': 'image/jpeg',
        'image/webp': 'image/webl'
    }
}

const app = express()
    .use(express.static(path.join(__dirname, 'public')))
    .use((req, res, next) => {
        if (req.url === '/swagger.json') res.sendFile(path.join(__dirname, 'swagger.json'))
        else next()
    })
    .use(express.text())
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => res.render('index'))
    .get('/api/ssweb', async (req, res) => {
        try {
            let {
                url,
                full,
                delay,
                type
            } = {
                url: '',
                full: false,
                delay: 0,
                type: 'png',
                ...req.query
            }
            type = type.toLowerCase()
            if (!type in CONSTANT.mimetype) type = 'png'
            if (url) {
                const browser = await getBrowser()
                const page = await browser.newPage()
                await page.goto(url, {
                    waitUntil: 'load',
                    timeout: 300000
                })
                if (delay > 0) await sleep(delay)
                const screenshot = swaggerOnly ? Buffer.from(type) : await page.screenshot({
                    type,
                    fullPage: full ? full != 'false' : false
                })
                await browser.close()
                res.writeHead(200, {
                    'Content-Type': CONSTANT.mimetype[type],
                    'Content-Length': screenshot.length
                })
                res.end(screenshot)
            } else {
                res.status(400).json({
                    error: 'parameter \'url\' not provided',
                    hint: '/api/ssweb?url=http://example.com',
                    status: 400
                })
            }
        } catch (e) {
            res.status(501).json({
                error: e.toString(),
                status: 501
            })
        }
    })
    .post('/api/canvas', async (req, res) => {
        let timeout
        try {
            let {
                apikey,
                type,
                quality
            } = {
                type: 'png',
                quality: 0.92,
                ...req.query
            }
            let code = req.body
            if (process.env.API_KEY && process.env.API_KEY != apikey) return res.json({
                result: 'apikey invalid'
            })
            type = type.toLowerCase()
            quality = Math.max(0, Math.min(quality, 1))
            const mimetype = CONSTANT.mimetype[type] || CONSTANT.mimetype.png
            log(type, quality, mimetype, req.query)
            const browser = await getBrowser()

            const page = await browser.newPage()
            page.on('console', l => log('[CHROME]', l._type, l._text))
            code = `try{\n${code}\n} catch (e) {\n console.error(e)\n}`
            log(code)
            timeout = setTimeout(() => {
                log('timed out')
                browser.close()
                res.status(201).json({
                    error: 'Timeout limit exceeded',
                    status: 201
                })
            }, 24000)
            const base64 = await page.evaluate(async function(code, mimetype, quality) {
                try {
                    let c = document.createElement('canvas')
                    let ctx = c.getContext('2d')
                    await (new(async () => {}).constructor('c', 'ctx', 'Image', code))(c, ctx, Image)
                    return (/png/.test(mimetype) ? c.toDataURL(mimetype) : c.toDataURL(mimetype, quality)).split `,` [1]
                } catch (e) {
                    return e.toString()
                }
            }, code, mimetype, quality)
            if (/error\:/i.test(base64)) throw base64
            clearTimeout(timeout)
            await browser.close()
            const image = swaggerOnly ? Buffer.from(type) : Buffer.from(base64, 'base64')
            log(image)
            if (res.headersSent) return
            res.writeHead(200, {
                'Content-Type': mimetype,
                'Content-Length': image.length
            })
            res.end(image)
        } catch (e) {
            clearTimeout(timeout)
            res.status(501).json({
                error: e.toString(),
                status: 501
            })
        }
    })
    .use('/api', swaggerUi.serve)
    .get('/api', swaggerUi.setup(null, false, options = {
        validatorUrl: null,
        docExpansion: 'full',
        operationsSorter: function(a, b) {
            var score = {
                '/api/ssweb': 1,
                '/api/canvas': 2,
            }
            // console.log('a', a.get("path"), b.get("path"))
            return score[a.get("path")] < score[b.get("path")]
        }
    }, '.swagger-ui .topbar { background-color: #0099FF }', null, '/swagger.json'))
    .get('*', function(req, res) {
        res.status(404).json({
            error: 'Page you are looking for is not found',
            hint: '/',
            status: 404
        })
    })
    .listen(PORT, () => console.log(`Listening on ${ PORT }`))
const io = require('socket.io')(app)

//listen on every connection
io.on('connection', socket => {
    socket.on('memoryUsage', () => socket.emit('memoryUsage', process.memoryUsage()))
})

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function getBrowser(opts = {}) {
    const chromeOptions = {
        headless: true,
        defaultViewport: {
            width: 1920,
            height: 1080
        },
        timeout: 120000,
        args: [
            "--incognito",
            "--no-sandbox",
            "--single-process",
            "--no-zygote",
            "--no-cache"
        ],
        ...opts
    }
    log('Launching Browser')
    return await puppeteer.launch(chromeOptions)
}

function log(...args) {
    console.log('\033[42mLOG\033[49m \033[33m%s\033[39m\n<', new Date(), ...args)
}