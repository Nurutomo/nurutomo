const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const app = express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('index'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
const io = require('socket.io')(app);

//listen on every connection
io.on('connection', (socket) => {
	socket.on('0', (e) => {
		socket.emit('0', e)
		console.log('Transfering:', e)
	})

	
	socket.emit('0', 'OOF')
})