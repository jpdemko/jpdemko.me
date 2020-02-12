const socketIO = require('socket.io')

const io = socketIO()

const socketAPI = { io }

io.on('connection', (socket) => {
	console.log('connected')

	socket.emit('hello', { msg: 'hello from server' })

	socket.on('sendMsg', (msg) => {
		console.log(msg)
		socket.emit('reverse', { msg })
	})

	socket.on('disconnect', () => {
		console.log('disconnected')
	})
})

module.exports = socketAPI
