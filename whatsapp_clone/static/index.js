let chat_history_template = `
<div id="upbar">
    <div id="upbar-div">
        <i class="fa-solid fa-user-group fa-lg" id="icon"></i>
    </div>
    <span id="chatname"><%= chat_name %></span>
</div>

<div id="messages">
    <ul id="message-scroll">
        <% for (let message of messagelist) { %>
            <% if (username === message[0]) { %>
                <div class="chat-message" style="margin-left: auto;background-color:#D9FDD3;text-align:right;margin-right:20px">
                    <span id="message_sender" style="background-color:#D9FDD3;display:block;text-align: left;height: fit-content;margin-bottom:3px">~<%= message[0] %></span>
                    <span id="message" style="background-color:#D9FDD3;display:block;text-align: left; height: fit-content"><%= message[1] %></span>
                </div>
            <% } else { %>
                <div class="chat-message">
                    <span id="message_sender">~<%= message[0] %></span>
                    <br>
                    <span id="message"><%= message[1] %></span>
                </div>
            <% } %>
        <% } %>
    </ul>
</div>

<button id="plus-btn" type="button" onclick="listContainerFn()"><i class="fa-solid fa-plus" id="plus"></i></button>

<div id="listContainer">
    <input id='fileid' type='file' name='file' multiple hidden/>
    <button class="listContainerBtn" onclick="listContainerBtnFn('Documents')"><i class="fa-regular fa-file"></i> <span>&ensp;Documents</span></button>
    <button class="listContainerBtn" onclick="listContainerBtnFn('Photos & Videos')"><i class="fa-solid fa-photo-film"></i>  <span>Photos & Videos</span></button>
</div>

<input type="text" name="" id="write-message" placeholder="  Type a message">
<input id="send" type="button" name="submit" value="Send" onclick="submit_form_trigger(0);">
`

file_upload_template = `
<div id="upbar">
    <div id="upbar-div">
        <i class="fa-solid fa-user-group fa-lg" id="icon"></i>
    </div>
    <span id="chatname"><%= chat_name %></span>
</div>

<div id="file_upload">
    <div id="filename">
        <div style="width: 1.5%">
            <i class="fa-solid fa-xmark" style="margin-left: 15px"></i>
        </div>
        <div style="width: 98.5%; display: flex; justify-content: center;">
            <p id="filename_display" style="margin: 0px;"> <%= filelist[idx][0] %> </p>
        </div>
    </div>
    <div id="file_preview">
        <i class="fa-regular fa-file fa-8x" style="margin-top: 50px;"></i>
        <p>No preview available</p>
    </div>
    <input type="text" name="" id="write-message-upload" placeholder="  Add a caption">
    <input id="send-upload" type="button" name="submit" value="Send" onclick="submit_form_trigger(1);">
    <div id="file-buttons">
        <% for (let i = 0; i < filelist.length; i++) { %>
            <% if (filelist[i][1] === "docx") { %>
                <div class="file-div"> <p hidden><%= filelist[i][0] %></p> <span hidden><%= captionlist[i] %></span> <i class="fa-regular fa-file-word fa-2x"></i> </div>
            <% } else if (filelist[i][1] === "pdf") { %>
                <div class="file-div"> <p hidden><%= filelist[i][0] %></p> <span hidden><%= captionlist[i] %></span> <i class="fa-regular fa-file-pdf fa-2x"></i> </div>
            <% } else if (filelist[i][1] === "txt") { %>
                <div class="file-div"> <p hidden><%= filelist[i][0] %></p> <span hidden><%= captionlist[i] %></span> <i class="fa-regular fa-file-lines fa-2x"></i> </div>
            <% } else {%>
                <div class="file-div"> <p hidden><%= filelist[i][0] %></p> <span hidden><%= captionlist[i] %></span> <i class="fa-regular fa-file fa-2x"></i> </div>
            <% } %>
        <% } %>
    </div>
</div>
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
window.click_count = false
var message_list = []
var selectedFileList = null
var message_type_value = null
var file_div = null
var filename_display = null
var cur_file_div_ele = null
var caption_ele = null
var caption_ele_content = null
var formData = null

function scrollDown() {
    const messages_scroll = document.querySelector('#message-scroll');
    messages_scroll.scrollTop = messages_scroll.scrollHeight - messages_scroll.clientHeight;
  }

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
        window.click_count = false
        window.chatSocket.close()
        chat_history.innerHTML = ejs.render(default_template)
    }
})

document.addEventListener("keydown2", (event) => {
    if (event.key == "Escape") {
        window.click_count = false
        if (window.chatSocket !== undefined) {
            window.chatSocket.close()
        }
    }
})

for (chat of chat_lst) {
    register_event_listener(chat)
}


function plus_btnFn(plus_btn) {
    console.log("Hello")
    plus_btn.addEventListener("click", () => {
        plus_btn.style.backgroundColor = "#dce1e9";
    })
}

function listContainerFn() {
    let listContainer = document.getElementById('listContainer');
    if (listContainer.style.display === "none") {
        listContainer.style.display = "flex";
        listContainer.style.flexWrap = "wrap";
    } else {
        listContainer.style.display = "none";
    }
}

function register_event_listener(chat) {
    chat.addEventListener("click", () => {
        if (window.click_count !== chat.innerText.split("\n\n")[1]) {
            document.dispatchEvent(new KeyboardEvent('keydown2', {'key': 'Escape'}))
        }
        chat.style.backgroundColor = "#F0F2F5"
        window.CHAT_HASH = chat.innerText.split("\n\n")[1]
        window.click_count = window.CHAT_HASH
        window.chatSocket = new WebSocket(
            "ws://"
            + window.location.host
            + "/ws/whatsapp_clone/chat/"
            + username + "/" + CHAT_HASH + "/"
        )
        fetchAPIMessages(url="http://127.0.0.1:8000/whatsapp_clone/chat/"+username+"/",
                        data={'chat_hash': CHAT_HASH}).then((message_list) => {
                            chat_history.innerHTML = ejs.render(chat_history_template, {chat_name: chat.innerText.split("\n\n")[0], messagelist: message_list, username:username})
                            scrollDown()
                        })
        // let plus_btn = document.getElementById("plus-btn")
        // plus_btnFn(plus_btn)
        window.chatSocket.onmessage = function(e) {
            fetchAPIMessages(url="http://127.0.0.1:8000/whatsapp_clone/chat/"+username+"/",
                        data={'chat_hash': CHAT_HASH}).then((message_list) => {
                            chat_history.innerHTML = ejs.render(chat_history_template, {chat_name: chat.innerText.split("\n\n")[0], messagelist: message_list, username:username})
                            scrollDown()
                        })
        }
        window.chatSocket.onclose = function(e) {
            chat.style.backgroundColor = "#ffffff"
        }
    })
    chat.addEventListener("mouseover", () => {
        if (window.click_count === chat.innerText.split("\n\n")[1]) {
            chat.style.backgroundColor = "#F0F2F5"
        }
        else {
            chat.style.backgroundColor = "#e1e1e15d"
        }
    })
    chat.addEventListener("mouseout", () => {
        if (window.click_count === chat.innerText.split("\n\n")[1]) {
            chat.style.backgroundColor = "#F0F2F5"
        }
        else {
            chat.style.backgroundColor = "#ffffff"
        }
    })
}

function register_file_upload_event_listener(file_div_ele) {
    file_div_ele.addEventListener("click", () => {
        cur_file_div_ele.style.borderColor = "#D1D7DB"
        file_div_ele.style.borderColor = "#00a884"
        document.getElementById("filename_display").innerText = file_div_ele.getElementsByTagName("p")[0].innerText
        filename_display = file_div_ele.getElementsByTagName("p")[0].innerText
        caption_ele.value = file_div_ele.getElementsByTagName("span")[0].innerText
        cur_file_div_ele = file_div_ele
    })
}

function caption_ele_event_listener() {
    caption_ele.addEventListener("keyup", () => {
        caption_ele_content = caption_ele.value
        cur_file_div_ele.getElementsByTagName("span")[0].innerText = caption_ele_content
    })
}

function file_div_highlight() {
    for (let file_div_ele of file_div) {
        if (file_div_ele.getElementsByTagName("p")[0].innerText === filename_display) {
            file_div_ele.style.borderColor = "#00a884"
            cur_file_div_ele = file_div_ele
        }
        register_file_upload_event_listener(file_div_ele)
    }
    caption_ele = document.getElementById("write-message-upload")
    caption_ele_event_listener()
}

function handleFiles() {
    let selectedFileList = this.files
    formData = new FormData()
    let filename_lst = []
    let fileinfo_lst = []
    for (let selectedFile of selectedFileList) {
        filename_lst.push(selectedFile.name)
        fileinfo_lst.push([selectedFile.name, selectedFile.name.split(".").pop()])
        formData.append(selectedFile.name, selectedFile)
    }
    formData.append('filename_lst', JSON.stringify(filename_lst))
    // formData.forEach((key, value) => {console.log(key)})
    chat_history.innerHTML = ejs.render(file_upload_template, {chat_name: chat.innerText.split("\n\n")[0], filelist: fileinfo_lst, idx: 0, captionlist: []})
    filename_display = document.getElementById("filename_display").innerText
    file_div = document.getElementsByClassName("file-div")
    file_div_highlight()

    // submit_form(message=formData, value=message_type_value)
    this.removeEventListener("change", handleFiles)
}

function listContainerBtnFn(value) {
    let inputElement = document.getElementById('fileid')
    inputElement.click()
    message_type_value = value
    inputElement.addEventListener("change", handleFiles)
}

async function fetchAPIMessages(url, data) {
    let csrftoken = getCookie('csrftoken')
    if (data instanceof FormData) {
        headers = {
            'X-CSRFToken': csrftoken
        }
    }
    else {
        headers = {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        }
        data = JSON.stringify(data)
    }
    const response = await fetch(url, {method: "POST", 
        headers: headers,
        body: data})
    const responseData = await response.json()
    let MESSAGE_LIST = responseData['message_list']
    return MESSAGE_LIST
}

function submit_form_trigger(flag) {
    if (flag == 1) {
        submit_form(message=formData, value=message_type_value)
    }
    else {
        submit_form()
    }
}

function submit_form(message=null, value=null) {
    if (message === null) {
        message = document.getElementById('write-message').value
        fetchAPIMessages(url="http://127.0.0.1:8000/whatsapp_clone/chat/"+username+"/",
            data={'chat_hash': window.CHAT_HASH, 'sender': username, 'message_type': 'text', 'content': message}).then((message_list) => {
            window.chatSocket.send(JSON.stringify({"message": message, "sender": username}))
    })
    }
    else {
        let caption_list = []
        for (let file_div_ele of file_div) {
            caption_list.push(file_div_ele.getElementsByTagName("span")[0].innerText)
        }
        message.append("caption_lst", JSON.stringify(caption_list))
        message.append("metadata", JSON.stringify({'chat_hash': window.CHAT_HASH, 'sender': username, 'message_type': value}))
        fetchAPIMessages(url="http://127.0.0.1:8000/whatsapp_clone/chat/"+username+"/upload/",
            data=message).then((message_list) => {
            window.chatSocket.send(JSON.stringify({"message": message, "sender": username}))
    })
    }
}
