const express = require('express');
const app = express();
const SocketIO = require("socket.io");
const ejs = require('ejs');

//set the template engine ejs
app.set('view engine', 'ejs');

//middlewares
app.use(express.static('public'));

//routes
app.get('/', (req, res) => {
	res.render('index');
});

//Listen on port
server = app.listen(process.env.PORT || 5000);

//socket.io instantiation
const io = SocketIO(server);

//listen on every connection
io.on('connection', (socket) => {
	socket.on(0, (e) => {
		socket.broadcast.emit(0, e);
	});
});