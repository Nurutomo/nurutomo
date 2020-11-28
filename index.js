const puppeteer = require('puppeteer')
const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const app = express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('index'))
  .get('/api/ssweb', async (req, res) => {
	  try {
		let { url, full, delay } = {
			url: '',
			full: false,
			delay: 0,
			...req.query
		}
		if (url) {
			const page = await global.browser.newPage()
			await page.goto(url, {
				waitUntil: 'load',
				timeout: 300000
			})
			if (delay > 0) await sleep(delay)
			const screenshot = await page.screenshot({
				type: 'png',
				encoding: 'base64',
				fullPage: !!full
			})
			res.writeHead(200, {
				'Content-Type': 'image/png',
				'Content-Length': screenshot.length
			});
			res.end(screenshot);
		} else {
			res.status(501).json({
				error: 'parameter \'url\' not provided',
				status: 501
			})
		}
	  } catch (e) {
		res.status(501).json({
			error: e,
			status: 501
		})
	  }
  })
  .get('*', function(req, res){
  	res.status(404)
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
/*const io = require('socket.io')(app);

//listen on every connection
io.on('connection', (socket) => {
	socket.on('0', (e) => {
		socket.emit('0', e)
		console.log('Transfering:', e)
	})

	socket.emit('0', 'OOF')
})*/

(async () => {
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
	}
	global.browser = await puppeteer.launch(chromeOptions);
    	console.log('Browser Launched')
})()

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
