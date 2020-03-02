/*global socket, video, config*/
const peerConnections = {};

/** @type {MediaStreamConstraints} */
// const constraints = {
// 	// audio: true,
// 	video: {facingMode: "user"}
// };

// navigator.mediaDevices.getUserMedia(constraints)
// .then(function(stream) {
// 	video.srcObject = stream;
socket.emit('broadcaster');
// }).catch(error => console.error(error));

socket.on('answer', function(id, description) {
    peerConnections[id].setRemoteDescription(description);
});

socket.on('watcher', async function(id) {
    const peerConnection = new RTCPeerConnection(config);
    console.log('peerConnection');
    console.log(peerConnection);
    peerConnections[id] = peerConnection;
    let localVideo = document.getElementById("video");
    let stream;
    try {
        const fps = 0;
        if (localVideo.captureStream) {
            stream = await localVideo.captureStream(fps);
        } else if (localVideo.mozCaptureStream) {
            stream = await localVideo.mozCaptureStream(fps);
        } else {
            stream = null;
            console.error('Stream capture is not supported');
        }
    } catch (e) {
        stream = null;
        alert(`getUserMedia() error: ${e.name}`);
    }
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    peerConnection.createOffer()
        .then(sdp => peerConnection.setLocalDescription(sdp))
        .then(function() {
            socket.emit('offer', id, peerConnection.localDescription);
        });
    peerConnection.onicecandidate = function(event) {
        if (event.candidate) {
            socket.emit('candidate', id, event.candidate);
        }
    };
});

socket.on('candidate', function(id, candidate) {
    peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on('bye', function(id) {
    peerConnections[id] && peerConnections[id].close();
    delete peerConnections[id];
});