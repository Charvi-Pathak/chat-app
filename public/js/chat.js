const socket = io(); //initialize connection

// Elements
const $form = document.querySelector('#msgForm');
const $msgInput = document.querySelector('input');
const $submitBtn = document.querySelector('#sendMsgBtn');
const $locBtn = document.querySelector('#shareLocationBtn');
const $messages = document.querySelector('#messages');
const $sidebarUsers = document.querySelector('#sidebar-users');

// Templates
const msgTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Query String
const { room, username } = Qs.parse(location.search, { ignoreQueryPrefix: true })

socket.on('message', msg => {
    const html = Mustache.render(msgTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm:ss a')
    })
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll()
});

socket.on('locationMessage', location => {
    const html = Mustache.render(locationTemplate, {
        username: location.username,
        locationUrl: location.locationUrl,
        createdAt: moment(location.createdAt).format('h:mm:ss a')
    })
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll()
});

socket.on('roomData', (data) => {
    // console.log(data);
    const html = Mustache.render(sidebarTemplate, {
        room: data.room,
        users: data.users
    });

    $sidebarUsers.innerHTML = html;
})

$form.addEventListener('submit', (e) => {
    e.preventDefault();
    $submitBtn.setAttribute('disabled', 'disabled');
    const message = $msgInput.value.trim();
    // if (message.length > 0)
    socket.emit('sendMessage', message, (error) => {
        $submitBtn.removeAttribute('disabled');
        $msgInput.value = '';
        // $msgInput.focus();

        //ACK function
        if (error) {
            return console.log(error);
        }
        // console.log('Message delivered!');
    });
});


$locBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation service not supported by your browser');
    }

    $locBtn.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }

        socket.emit('shareLocation', location, () => {
            $locBtn.removeAttribute('disabled');
        });

        $msgInput.focus();

    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
    $msgInput.focus();
});

const autoscroll = () => {

    // Get new msg element, it wil be at the last
    const $newMessage = $messages.lastElementChild;

    // Total Height of the new message
    const newMessageMargin = parseInt(getComputedStyle($newMessage).marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // How far the screen has been scrolled
    const scrollOffset = $messages.scrollTop + $messages.offsetHeight;

    if ($messages.scrollHeight - newMessageHeight <= scrollOffset) {
        //scroll to the bottom
        $messages.scrollTop = $messages.scrollHeight;
    }
}