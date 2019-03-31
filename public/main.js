//make connection
var socket = window.socket = io.connect(location.origin);

socket.on('0', (e) => {
	console.log('Receive:', e);
});

document.addEventListener('keypress', (e) => {
	socket.emit('0', e.key);
	console.log('Send:', e.key);
})