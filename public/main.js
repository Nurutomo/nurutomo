
$(function(){

	var isConnect;
	var rank = 0;
	var player;
	var timeout;


  //make connection
  var socket = io.connect(location.origin, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax : 5000,
    reconnectionAttempts: 99999
	});

	//buttons and inputs
	var msgC = $('#message');
	var send = $('#send');
	var user = $("#username");
	var chat = $("#chat");
	var typing = $("#typing");
	var color = $('#color');
	var pList = $('#player-list');

	socket.on('pl', (msg) => {
		html = [];
		a = msg.p.map( (p) => {
			obj = '';
			switch(p.rank) {
				case 1:
					obj = '<span class="badge badge-primary"';
					break;
				case 2:
					obj = '<span class="badge badge-success"';
					break;
				case 3:
					obj = '<span class="badge badge-danger"';
					break;
				case 4:
					obj = '<span class="badge badge-warning"';
					break;
			}

			html.push(`${obj}>${p.name}</span>`);
		});
		pList.html(html.join(' '));
	});

	//Listen on new_message
	socket.on("a", (msg) => {
		if (msg.o.t) {
			player.rank = msg.p.rank;
			localStorage.lg = msg.o.lg;
		}

		console.log(msg.p.name + ": " + msg.a)
		obj = '';
		switch(msg.p.rank) {
			case 1:
			obj = ['class="badge badge-primary">',`Member`];
			break;
			case 2:
			obj = ['class="badge badge-success">','Moderator'];
			break;
			case 3:
			obj = ['class="badge badge-danger">','Admin'];
			break;
			case 4:
			obj = ['class="badge badge-warning">','Owner'];
			break;
		}

		chat.append(
			`<li class="list-group-item list-group-item-light"><span ${obj.join('')}</span> <span ${obj[0] + msg.p.name}: ${msg.a}</span></li>`);
		chat.animate({ scrollTop: document.getElementById("chat").scrollHeight - chat.height() }, 200);
	});

	socket.emit('join', {
		p: {
			name: localStorage.user,
			color: localStorage.color,
			lg: localStorage.lg
		}
	});

	socket.on("join", (msg) => {
		chat.append(`<li class="list-group-item list-group-item-info">${msg.p.name} joined.</li>`);
		chat.animate({ scrollTop: document.getElementById("chat").scrollHeight - chat.height() }, 250);
	});

	socket.on("hi", (msg) => {
		user.val(msg.p.name);
		color.val(msg.p.color);
		color.css("background-color", color.val());
		player = msg.p;
		console.log('Connected! Your rank is ' + player.rank);
		isConnect = true;
	});

	socket.on("left", (msg) => {
		chat.append(`<li class="list-group-item list-group-item-info">${msg.p.name} left.</li>`);
		chat.animate({ scrollTop: document.getElementById("chat").scrollHeight - chat.height() }, 250);
	});

	//Listen on typing
	socket.on('type', (msg) => {
		clearTimeout(timeout || setTimeout(console.log, 9999));
		let a = Object.keys(msg.p);
		let b = " is typing...";
		typing.html(a.map(c=>msg.p[c].name) + b);
		timeout = setTimeout(function () {
			typing.html('')
		}, 1000);
		console.log(msg.p,a,b);
	});

	$(window).bind('beforeunload', () => {
		localStorage.user = user.val();
		localStorage.color = color.val();
		socket.emit('left');
	});

	function sendChat(msg) {
		if (msg.length) {
			socket.emit('a', {
				a: msg
			});
		}
	}

	msgC.keyup((e) => {
		socket.emit('type', {
			c: "d"
		});
	});

	msgC.keydown((e) => {
		socket.emit('type', {
			c: "t"
		});
		var keyCode = (e.keyCode ? e.keyCode : e.which);
		if (keyCode == 13) {
			sendChat(msgC.val());
			msgC.val('');
		}
	});

	send.click(function () {
		sendChat(msgC.val());
		msgC.val('');
	});

	user.keypress((e) => {
		var keyCode = (e.keyCode ? e.keyCode : e.which);
		if (keyCode == 13) {
			socket.emit('userset', {
				p: {
					name: user.val()
				}
			});
		}
	});

	// color.bind("change", () => {
	// 	socket.emit('userset', {
	// 		p: {
	// 			color: color.val()
	// 		}
	// 	});
	// });

	socket.on('disconnect', function () {
    	isConnect = false;
			location.reload();
	});
});
