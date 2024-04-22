let template = `
<div id="upbar">
    <span id="chatname"><%= chat_name %></span>
</div>

<div id="messages">
    <ul id="message-scroll">
        <% for (let message of messagelist) { %>
            <div class="chat-message">
                <span id="message_sender"><%= message[0] %></span>
                <br>
                <span id="message"><%= message[1] %></span>
            </div>
            <br>
        <% } %>
    </ul>
</div>

<form action="" method="post" id="message-form">
    <input type="text" name="" id="write-message" placeholder="  Type a message">
    <input type="button" name="submit" value="Send" onclick="submit_form();"/>
</form>
`

var chat_lst = document.querySelectorAll(".chat")
let chat_history = document.querySelector("#chat_history")
let default_template = chat_history.innerHTML
let message_form = document.getElementById("message-form")
let new_chat = document.getElementById("new_chat")
let new_group = document.getElementById("new_group")
let new_chat_popup = document.getElementById("new_chat_popup")
let new_group_popup = document.getElementById("new_group_popup")
var username = document.getElementById('user_data').getAttribute('data-username')
let scroll = document.getElementById("scroll")
var message_list = []

function chatpopFn() {
    document.getElementById('overlay').style.display = 'block'
    new_chat_popup.style.display = 'block'
}

function grouppopFn() {
    document.getElementById('overlay').style.display = 'block'
    new_group_popup.style.display = 'block'
}

function closechatFn() {
    document.getElementById('overlay').style.display = 'none'
    new_chat_popup.style.display = 'none'
}

function closegroupFn() {
    document.getElementById('overlay').style.display = 'none'
    new_group_popup.style.display = 'none'
}

function newchatFn() {
    let new_chat_username = document.getElementById('new_chat_username').value
    fetchFn(url="http://127.0.0.1:8000/whatsapp_clone/chat/"+username+"/", 
            data={"name": username+"+"+new_chat_username, "participants": [username, new_chat_username], "username": username})
}

function newgroupFn() {
    let new_group_name = document.getElementById('new_group_groupname').value
    let new_group_members = document.getElementById('new_group_members').value
    const new_group_members_list = new_group_members.split(",").map(item => item.trim())
    fetchFn(url="http://127.0.0.1:8000/whatsapp_clone/chat/"+username+"/", 
            data={"name": new_group_name, "participants": [username].concat(new_group_members_list), "username": username})
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}


async function fetchFn(url, data) {
    let csrftoken = getCookie('csrftoken')
    let response = await fetch(url, {method: "POST", 
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-CSRFToken': csrftoken
                                    },
                                    body: JSON.stringify(data)}).then(response => response.json()).then(responseData => {
                                        chat_dict = responseData['chat_dict']
                                    }).catch(error => console.error('Error:', error));
    chat_lst = Object.keys(chat_dict)
    let html_string = ''
    for (chatname of chat_lst) {
        html_string += '<button class="chat"> <p>' + chatname + '</p> </button>'
    }
    scroll.innerHTML = html_string
    closechatFn()
    closegroupFn()
}

document.addEventListener("keydown", (event) => {
    if (event.key == "Escape") {
        window.chatSocket.close()
        chat_history.innerHTML = ejs.render(default_template)
    }
})

for (chat of chat_lst) {
    register_event_listener(chat)
}

function register_event_listener(chat) {
    chat.addEventListener("click", () => {
        window.CHAT_HASH = chat.innerText.split("\n\n")[1]
        window.chatSocket = new WebSocket(
            "ws://"
            + window.location.host
            + "/ws/whatsapp_clone/chat/"
            + username + "/" + CHAT_HASH + "/"
        )
        fetchAPIMessages(url="http://127.0.0.1:8000/whatsapp_clone/chat/"+username+"/",
                        data={'chat_hash': CHAT_HASH}).then((message_list) => {
                            chat_history.innerHTML = ejs.render(template, {chat_name: chat.innerText.split("\n\n")[0], messagelist: message_list})
                        })
        window.chatSocket.onmessage = function(e) {
            fetchAPIMessages(url="http://127.0.0.1:8000/whatsapp_clone/chat/"+username+"/",
                        data={'chat_hash': CHAT_HASH}).then((message_list) => {
                            chat_history.innerHTML = ejs.render(template, {chat_name: chat.innerText.split("\n\n")[0], messagelist: message_list})
                        })
        }
        window.chatSocket.onclose = function(e) {
            console.error("Chat socket closed!")
        }
    })
}

async function fetchAPIMessages(url, data) {
    let csrftoken = getCookie('csrftoken')
    const response = await fetch(url, {method: "POST", 
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRFToken': csrftoken
                                },
                                body: JSON.stringify(data)})
    const responseData = await response.json()
    let MESSAGE_LIST = responseData['message_list']
    return MESSAGE_LIST
}

function submit_form() {
    let message = document.getElementById('write-message').value
    fetchAPIMessages(url="http://127.0.0.1:8000/whatsapp_clone/chat/"+username+"/",
                    data={'chat_hash': window.CHAT_HASH, 'sender': username, 'message_type': 'text', 'content': message}).then((message_list) => {
                        window.chatSocket.send(JSON.stringify({"message": message, "sender": username}))
    })
}