//make connection
var socket = io.connect(location.origin);
window.socket = socket;

socket.on(0, (e) => {
	console.log('Receive:', e);
});

document.addEventListener('keypress', (e) => {
	socket.emit(0, e);
	console.log('Send:', e);
})