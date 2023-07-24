// 설치한 express, socket.io, http 모듈 불러오기
const express = require('express')

const socket = require('socket.io')

const http = require('http')

// Node.js 기본 내장 모듈 불러오기. fs모듈 : 파일과 관련된 처리를 할 수 있음.
const fs = require('fs')
const { SocketAddress } = require('net')
const { time, clear } = require('console')
const { clearInterval } = require('timers')

const app = express() // express 객체 생성

const server = http.createServer(app) // express http 서버 생성

const io = socket(server) // 생성된 서버를 socket.io에 바인딩

const SocketEvent = {
    Connnection: 'connection',
    NewUser: 'newUser',
    Update: 'update',
    Connect: 'connect',
    Disconnect: 'disconnect',
    Message: 'message',
    Offer: 'offer',
    Me: 'me',
    Other: 'other',
    LowPoint: 'lowPoint',
    InsufficientPoint: 'insufficientPoint',
    SuccessBid: 'successBid',
    TimerUpdate: 'timerupdate'
}


// 경매용 변수들
let timerInterval
let timerTime

let currentBid = 0 // 현재 입찰가. 계속 갱신 될 것. 초기값은 0
let bidderName

/* 정적 파일을 제공하기 위해 미들 웨어를 사용하는 코드. 미들웨어란 서로 다른 애플리케이션이 서로 통신하는 데 사용되는 소프트웨어. 즉, 서로 통신하는데 바로는 불가능하니까 이걸 돕는 것. 
http://서버주소/css 로는 액세스가 불가. 하지만 이를 이용하면 외부 클라이언트들이 /css경로로 액세스가 가능해짐. */
app.use('/css', express.static('./static/css'))
app.use('/js', express.static('./static/js'))
app.use('/img', express.static('./static/img'))


// get 방식으로 / 경로에 접속하면 실행되는 것
app.get('/', function(request, response) {
    fs.readFile('./static/index.html', function(err, data) {
        if(err){
            response.send('에러')
        }
        else{
            response.writeHead(200, {'Content-eventType':'text/html'})
            response.write(data)
            response.end()
        }
    })
})

/* on() 함수는 소켓에서 해당 이벤트를 받으면 콜백함수가 실행된다. connection 이라는 이벤트가 발생할 경우 콜백함수가 실행된다.
    io. sockets은 접속되는 모든 소켓들을 의미. 접속되는 동시에 콜백함수로 전달되는 소켓은 접속된 해당 소켓임.
    disconnect는 socket.io 기본 이벤트로 연결되었던 소켓과 접속이 끊어지면 자동으로 실행이 됨.*/

io.sockets.on(SocketEvent.Connnection, function(socket) {

    // 새로운 유저가 접속했을 경우 다른 소켓에게도 알려줌
    socket.on(SocketEvent.NewUser, function(data) {
        console.log(data.name + '님이 접속하였습니다.')

        socket.name = data.name // 소켓에 이름 저장해두기
        
        io.sockets.emit(SocketEvent.Update, {eventType: SocketEvent.Connect, name: 'SERVER', message: data.name + '님이 접속하였습니다.', currentBid: currentBid})
    })

    // 전송한 메시지 받기
    socket.on(SocketEvent.Message, function(data) {
        
        data.name = socket.name // 받은 데이터에 누가 보냈는지 이름을 추가
        data.currentBid = currentBid
        console.log(data)

        socket.broadcast.emit(SocketEvent.Update, data); // 보낸 사람을 제외한 나머지 유저에게 메시지 전송
    })

    socket.on(SocketEvent.Offer, function(data){
        setTIMER()
        data.name = socket.name

        currentBid = data.offerPoint
        data.offerPoint = data.offerPoint - data.currentBid
        data.currentBid = currentBid
        bidderName = socket.name

        console.log(data)
        io.sockets.emit(SocketEvent.Update, data)
    })

    // 접속 종료시
    socket.on(SocketEvent.Disconnect, function() {
        console.log(socket.name + '님이 나가셨습니다.')

        // 나간 사람을 제외한 나머지 유저들에게 메시지 전송
        socket.broadcast.emit(SocketEvent.Update, {eventType: SocketEvent.Disconnect, name: 'SERVER', message: socket.name + '님이 나가셨습니다.', currentBid: currentBid})
    })
})

/* io.sockets.emit() => 모든 유저(본인포함) 
   socket.broadcast.emit() => 본인을 제외한 나머지 모두 */


function setTIMER(){
    timerTime = 5000
    clearInterval(timerInterval)
    timerInterval = setInterval(() => {
        if(timerTime != 0){
            timerTime = timerTime - 10
            io.sockets.emit(SocketEvent.Update, {eventType:SocketEvent.TimerUpdate, time: timerTime, currentBid: currentBid})
        }
        else { //낙찰 된 경우
            clearInterval(timerInterval)
            io.sockets.emit(SocketEvent.Update, {eventType:SocketEvent.SuccessBid, bidder: bidderName, currentBid: 0, winningBid: currentBid})
            currentBid = 0
        }
    }, 10);
}
function resetTIMER(){
    timerTime = 15000
    
}

// 서버를 8080포트로 listen
server.listen(8080, function() {
    console.log('서버 실행 중...')
})