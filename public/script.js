const socket = io("/");
const videoGrid = document.getElementById("video-grid");
let myPeer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: HTTPS_PORT || "8080",
});
let myVideoStream;
const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {};

let isScreenSharing = false;

myPeer.on("open", (id) => {
  console.log("open id: ", id);
  socket.emit("join-room", ROOM_ID, id);
});

socket.on("user-disconnected", (userId) => {
  console.log("user-disconnected", userId);
  if (peers[userId]) {
    console.log("peers[userId]");
    document.getElementById(userId).remove();
    peers[userId].close();
  }
});

switchFunction("getUserMedia", { audio: true, video: true });

async function switchFunction(switchBetween, options) {
  await navigator.mediaDevices[switchBetween](options).then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);
    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      video.id = userId;
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
      socket.on("user-connected", (userId) => {
        console.log("user-connected", userId);
        connectToNewUser(userId, stream);
      });
    });
  });
}

function connectToNewUser(userId, stream) {
  console.log("connectToNewUser: ", userId);
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  video.id = userId;
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  // if (isScreenSharing) {
  //   video.classList.add("is-screen");
  // } else {
  //   video.classList.remove("is-screen");
  // }
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const playStop = () => {
  console.log("object");
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const gdmOptions = {
  video: {
    cursor: "always",
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 44100,
  },
};
const shareScreen = async () => {
  console.log("shareScreen");
  if (!isScreenSharing) {
    reset();
    await switchFunction("getDisplayMedia", gdmOptions);
    isScreenSharing = true;
  } else {
    reset();
    await switchFunction("getUserMedia", { audio: true, video: true });
    isScreenSharing = false;
  }
};

const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>كتم الصوت</span>
  `;
  document.querySelector(".main__mute_button").innerHTML = html;
};

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>استمرار الصوت</span>
  `;
  document.querySelector(".main__mute_button").innerHTML = html;
};

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>ايقاف الفيديو</span>
  `;
  document.querySelector(".main__video_button").innerHTML = html;
};

const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>استمرار الفيديو</span>
  `;
  document.querySelector(".main__video_button").innerHTML = html;
};

function reset() {
  stopAllTracks();
  myPeer.disconnect();
  myPeer.destroy();
  myPeer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    port: HTTPS_PORT || "8080",
  });
  myPeer.on("open", (id) => {
    console.log("open id: ", id);
    socket.emit("join-room", ROOM_ID, id);
  });
}

function stopAllTracks() {
  let tracks = myVideoStream.getTracks();
  tracks.forEach((track) => track.stop());
}

const scrollToBottom = () => {
  var d = $(".main__chat_window");
  d.scrollTop(d.prop("scrollHeight"));
};

// input value
let text = $("input");
// when press enter send message
$("html").keydown(function (e) {
  if (e.which == 13 && text.val().length !== 0) {
    socket.emit("message", text.val());
    text.val("");
  }
});

socket.on("createMessage", (message) => {
  $("ul").append(`<li class="message"><b>${USER_NAME}</b><br/>${message}</li>`);
  scrollToBottom();
});
