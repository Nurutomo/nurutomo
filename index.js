const express = require('express');
const app = express();
const SocketIO = require("socket.io");
const publicIp = require('public-ip');
const port = 3000;
var isLocalhost = false;

//set the template engine ejs
app.set('view engine', 'ejs');

//middlewares
app.use(express.static('public'));

//routes
app.get('/', (req, res) => {
	fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
	isLocalhost = req.get('host') == 'localhost';
	console.log(fullUrl);
	res.render('index');
});

//Listen on port 3000
server = app.listen(port);
(async () => {
    console.log(await publicIp.v4());
    console.log(await publicIp.v6());
})();

const ps = {
	owner: 'dis is ez bro',
	admin: 'only admin can',
	mod: 'freemod4every1'
};

var players = {};

var typing = {};

//socket.io instantiation
const io = SocketIO(server);

///// HACKED AREA /////

// Socket IO Events //

var ori_emit = SocketIO.prototype.$emit // http://nodejs.org/api/events.html#events_emitter_emit_event_arg1_arg2
SocketIO.prototype.$emit = function() {
  ori_emit.apply(this, arguments);
  var args = Array.prototype.slice.call(arguments);
  var event = args.shift();
  ori_emit.apply(this, ['*', event, args]);
};

///////////////////////

//listen on every connection
io.on('connection', (socket) => {
	//default username
	socket.public = {
		name: "Anonymous",
		_id: socket.id,
		id: Object.keys(io.sockets.sockets).indexOf(socket.id),
		rank: 0,
	};

	socket.private = {
		quota: {
			chat: 8 // chat per second
		},
		add: {
			kick: ''
		}
	}

	var onevent = socket.onevent;
	socket.onevent = function (packet) {
    var args = packet.data || [];
    onevent.call (this, packet);    // original call
    packet.data = ["*"].concat(args);
    onevent.call(this, packet);      // additional call to catch-all
	};

	socket.on('*', () => {
		io.sockets.emit('pl', {
			p: Object.keys(io.sockets.sockets).map(a=>io.sockets.sockets[a].public),
			t: new Date().getTime()
		});
	});

	socket.on('join', (msg) => {
		socket.public.name = msg.p.name || socket.public.name;
		console.log(socket.public.name + ' joined');
		socket.public.rank = (isLocalhost||msg.p.lg==ps.owner)?4:(msg.p.lg==ps.admin)?3:(msg.p.lg==ps.mod)?2:1;
		socket.emit('hi', {
			p: socket.public,
			t: new Date().getTime()
		});

		io.sockets.emit('join', {
			p: socket.public,
			t: new Date().getTime()
		});
	});

	socket.on('disconnect', () => {
		console.log(socket.public.name + ' left');
		socket.broadcast.emit('left', {
			p: socket.public,
			t: new Date().getTime()
		});
  })

    //listen on change_username
    socket.on('userset', (msg) => {
    	socket.public.name = msg.p.name
    });

    //listen on new_message
    socket.on('a', (msg) => {
        //broadcast the new message
        console.log(socket.public.name + ': ' + msg.a);
				if (msg.a.startsWith('/')) {
        	if (msg.a.startsWith('/login ')) {
						t = msg.a.substr(7);
	        	socket.public.rank = (t==ps.owner)?4:(t==ps.admin)?3:(t==ps.mod)?2:1;
	        	socket.emit('a', {
	        		a: socket.public.rank-1?"Logined as " + [null,"Mod","Admin","Owner"][socket.public.rank-1]:"Wrong Password!",
	        		o: {
									lg: t,
									t: true
								},
	        		p: socket.public,
	        		t: new Date().getTime()
	        	});
					}
        } else {
        	io.sockets.emit('a', {
        		a: msg.a,
        		o: {
							lg: 'You found easter egg! :D',
							t: false
						},
        		p: socket.public,
        		t: new Date().getTime()
        	});
        }
    });

    //listen on typing
    socket.on('type', (msg) => {
			typing = {...typing,
				[socket.public._id]: socket.p
			};

			if(msg.c == "d") {
				delete typing[socket.public._id];
			}
    	socket.broadcast.emit('type', {
    		p: typing,
    		t: new Date().getTime()
    	});
    });
});
