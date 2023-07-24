var socket = io()

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

let currentBid //현재 입찰가 이 값은 서버에서 받아오는 데이터로만 갱신할 것.

let myPoint

/* 접속 되었을 때 실행 */
socket.on(SocketEvent.Connect, function() {
  /* 이름을 입력받고 */
  let name = prompt('반갑습니다!', '')

  /* 이름이 빈칸인 경우 */
  if(!name) {
    name = '익명'
  }

  socket.name = name
  myPoint = 1000

  /* 서버에 새로운 유저가 왔다고 알림 */
  socket.emit(SocketEvent.NewUser, {name, currentBid})
})

/* 서버로부터 데이터 받은 경우 */
socket.on(SocketEvent.Update, function(data) {
  const Timer = document.getElementById("Timer")

  currentBid = data.currentBid

  
  // 타입에 따라 적용할 클래스를 다르게 지정
  switch(data.eventType) {
    case SocketEvent.TimerUpdate:
      data.time
      UpdateTimer(data.time)
      break
      
    case SocketEvent.Message:
      makechatting(data)
      break

    case SocketEvent.Offer:
      makechatting(data)
      break

    case SocketEvent.Connect:
      notify(data)
        
      break

    case SocketEvent.Disconnect:
      notify(data)
      break

    case SocketEvent.SuccessBid:
      makechatting(data)
      notify(data)
      if(data.bidder == socket.name) {
        myPoint = myPoint - data.winningBid
      }
      break
  }
  
  const remainingPoint = document.getElementById('remainingPoint')
  remainingPoint.textContent = '잔여 포인트: '+ myPoint
  // 항상 스크롤은 아래에 되어있도록
  scrollChat()
})

// 타이머 갱신 함수
function UpdateTimer(timerTime){
  const t = (Number(timerTime) / 1000).toFixed(2)
  document.getElementById("timer").textContent = t
}

/* 메시지 전송 함수 */
function sendMessage(e) {
  const code = e.code

  if(code == 'Enter' || code == 'NumpadEnter'){
    // 입력되어있는 데이터 가져오기
    let message = document.getElementById('inputText').value
  
    if(message != ''){
      // 가져왔으니 데이터 빈칸으로 변경
    document.getElementById('inputText').value = ''

    // 내가 전송할 메시지 클라이언트에게 표시
    const chat = document.getElementById('chatBg')
    const msg = document.createElement('div')
    const node = document.createTextNode(message)
    msg.classList.add('me')
    msg.appendChild(node)
    chat.appendChild(msg)
    scrollChat()

    // 서버로 message 이벤트 전달 + 데이터와 함께
    socket.emit(SocketEvent.Message, {eventType: SocketEvent.Message, message: message})
    }

  }
}

// 받은 메시지를 채팅으로 표현하는 함수
function makechatting(data) {
  const chatBg = document.querySelector('#chatBg') // 채팅 영역 선택

  const chatting = document.createElement('div') // 프로필 사진 및 채팅을 묶을 것
  chatting.classList.add('chatting')
  const message = document.createElement('div') // 채팅 내용
  
  let className // 클래스 네임 선언 => let은 여러번 선언이 안되기 때문
  let node // 텍스트 노드 선언

  switch(data.eventType) {
    case SocketEvent.Message:
      const profileImage = new Image() //프로필 사진 객체
      node = document.createTextNode(`${data.name}: ${data.message}`)
      className = SocketEvent.Other
      profileImage.src = "./img/profileIMG.jpg"
      profileImage.classList.add('profileImg')
      chatting.appendChild(profileImage)
      
      break
    case SocketEvent.Offer:
      node = document.createTextNode(`${data.name}: ${data.currentBid}포인트`)
      className = SocketEvent.Offer
      
      break

    case SocketEvent.SuccessBid:
      className = SocketEvent.Offer

      // 낙찰 컬러메시지를 위한 선언
      const ColorMessage = document.createElement('span')
      ColorMessage.style.color = "#ff5555"

      // 경매 대기 문자를 위한 선언
      const WaitDiv = document.createElement('div')
      WaitDiv.classList.add('chatting')
      const WaitMessage = document.createElement('span')
      WaitMessage.classList.add
      WaitMessage.style.color = "rgb(102, 102, 102)"


      node = document.createTextNode(`${data.bidder}: ${data.winningBid}포인트 -- `)
      const Node2 = document.createTextNode("낙찰")
      
      message.classList.add(className) // 몇포인트 낙찰인지 메시지 파트
      message.appendChild(node)
      ColorMessage.appendChild(Node2) // 낙찰 메시지 파트
      message.appendChild(ColorMessage)
      
      chatting.appendChild(message)

      // 다음 경매 대기 문자 파트
      const Node3 = document.createTextNode("--다음 경매 대기--")

      WaitMessage.classList.add(className)
      WaitMessage.appendChild(Node3)
      WaitDiv.appendChild(WaitMessage)

      chatBg.appendChild(chatting)
      chatBg.appendChild(WaitDiv)

      remove_chat()
      break
  }

  // SocketEvent.SuccessBid 일때는 따로 함. let사용을 최대한 줄이고 const 사용을 위해서
  if(data.eventType != SocketEvent.SuccessBid) {
    message.classList.add(className)
    message.appendChild(node)
    chatting.appendChild(message)
    chatBg.appendChild(chatting)
  }
}

// 직접 포인트 써서 입찰시
function offer(e) {
  const code = e.code
  console.log(code)

  if(code == 'Enter' || code == 'NumpadEnter') {
    const offerPoint = Number(document.getElementById('point').value)

    if(offerPoint > myPoint){ // 잔여포인트 보다 많은 포인트를 제시했을때
      notify({eventType: SocketEvent.InsufficientPoint})
    } 
    else if(offerPoint > Number(currentBid)){ // 정상적으로 제시 했을때
      document.getElementById('point').value = ""
      socket.emit(SocketEvent.Offer, {eventType: SocketEvent.Offer, offerPoint: offerPoint, currentBid: currentBid, socketPoint: myPoint})
    }
    else{ // 나머지 경우 | 현재 입찰가 보다 낮은 포인트를 제시했을때
      notify({eventType: SocketEvent.LowPoint})
    }
  }
    
}

// 입찰 버튼으로 입찰시
function offerBtn(offerPoint) {
  const point = document.getElementById('point').value
  document.getElementById('point').value = Number(point) + Number(offerPoint)
}




// 서버 입장 퇴장시 동적 알림
function notify(data) {
  const message = document.createElement('div') // 채팅 내용
  const notification = document.getElementById('notificationBg') // 공지 알림
  let node
  let className
  switch(data.eventType){
    case SocketEvent.Connect:
      node = document.createTextNode(`${data.name}: ${data.message}`)
      className = SocketEvent.Connect
      currentBid = data.currentBid
      break

    case SocketEvent.Disconnect:
      node = document.createTextNode(`${data.name}: ${data.message}`)
      className = SocketEvent.Disconnect
      break

    case SocketEvent.LowPoint:
      node = document.createTextNode("현재 입찰가보다 높은 금액을 제시하여주세요.")
      className = SocketEvent.LowPoint
      break

    case SocketEvent.InsufficientPoint:
      node = document.createTextNode("잔여 포인트가 부족합니다.")
      className = SocketEvent.InsufficientPoint
      break

    case SocketEvent.SuccessBid:
      node = document.createTextNode(`${data.bidder}님이 낙찰되셨습니다.`)
      className = SocketEvent.SuccessBid
      break
  }
  message.classList.add(className)
  message.classList.add('noti')
  message.appendChild(node)
  notification.appendChild(message)
  show_and_remove_Notification(message)
}

// 공지 떴다가 사라지게 하는 함수
function show_and_remove_Notification(notification) {
    notification.classList.add('show')
    setTimeout(() => {
      notification.classList.remove('show')
    }, 2000)
    setTimeout(() => {
      notification.remove()
    }, 2800)
}

function remove_chat(){
  const Chatting = document.querySelectorAll('.chatting')
  setTimeout(() => {
    Chatting.forEach((chat) => chat.remove())
  }, 5000)
}

// 스크롤 아래 고정시키기
function scrollChat() {
  // 채팅창 선택
  const chat = document.querySelector('#chatBg');
  chat.scrollTop = chat.scrollHeight; // 스크롤의 위치를 최하단으로
}