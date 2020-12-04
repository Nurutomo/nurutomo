//make connection
var socket = window.socket = io.connect(location.origin)

socket.on('memoryUsage', e => {
	console.log('Receive:', e)
	let list = []
	let div = document.querySelector('div#usage')
	for (key in e) list.push(`<pre><code>${key}: ${e[key]}</code></pre>`)
	div.innerHTML = list.join('<br>')
})
/*
document.addEventListener('keypress', (e) => {
	socket.emit('0', e.key)
	console.log('Send:', e.key)
})
*/
