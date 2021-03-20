import Transmuxer from 'm2ts-to-fmp4-experimental';

let videoSourceBuffer = null;
let audioSourceBuffer = null;
const videoSegments = [];
const audioSegments = [];

const transmuxer = new Transmuxer();

const videoAppendSegment = () => {
  if (videoSourceBuffer == null) { return; }
  if (videoSegments.length === 0) { return; }

  const data = videoSegments[0];
  if (!videoSourceBuffer.updating) {
    videoSourceBuffer.appendBuffer(data);
    videoSegments.shift();
  }
};

const audioAppendSegment = () => {
  if (audioSourceBuffer == null) { return; }
  if (audioSegments.length === 0) { return; }

  const data = audioSegments[0];
  if (!audioSourceBuffer.updating) {
    audioSourceBuffer.appendBuffer(data);
    audioSegments.shift();
  }
};


const mediaSource = new MediaSource();
const videoElem = document.getElementById('video');
videoElem.src = URL.createObjectURL(mediaSource);
videoElem.addEventListener('loadedmetadata', () => {
  video.muted = true;
  videoElem.play();
})

mediaSource.addEventListener('sourceopen', () => {
  const socket = new window.WebSocket('ws://localhost:8080');
  socket.binaryType = 'arraybuffer';

  socket.addEventListener('message', (message) => {
    const result = transmuxer.transmux(new Uint8Array(message.data));

    if (result.initSegment && result.initSegment.tracks.video) {
      const videoMime = `${result.initSegment.tracks.video.container};codecs="${result.initSegment.tracks.video.codec}"`;
      if (!videoSourceBuffer) {
        videoSourceBuffer = mediaSource.addSourceBuffer(videoMime);
        videoSourceBuffer.addEventListener('updateend', videoAppendSegment);
      }
    }
    if (result.initSegment && result.initSegment.tracks.audio) {
      const audioMime = `${result.initSegment.tracks.audio.container};codecs="${result.initSegment.tracks.audio.codec}"`;
      if (!audioSourceBuffer) {
        audioSourceBuffer = mediaSource.addSourceBuffer(audioMime);
        audioSourceBuffer.addEventListener('updateend', audioAppendSegment);
      }
    }

    //
    if (result.initSegment && result.initSegment.tracks.video) {
      videoSegments.push(result.initSegment.tracks.video.initSegment);
    }
    if (result.video) {
      videoSegments.push(Transmuxer.appendUint8Array(result.video.data1, result.video.data2));
    }
    videoAppendSegment();

    //
    if (result.initSegment && result.initSegment.tracks.audio) {
      audioSegments.push(result.initSegment.tracks.audio.initSegment);
    }
    if (result.audio) {
      audioSegments.push(Transmuxer.appendUint8Array(result.audio.data1, result.audio.data2));
    }
    audioAppendSegment();
  })
})
