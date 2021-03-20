import TSDemuxer from 'hls.js/src/demux/tsdemuxer';
import MP4Remuxer from 'hls.js/src/remux/mp4-remuxer';

import Hls from 'hls.js';
import { hlsDefaultConfig } from 'hls.js/src/config';
import { appendUint8Array } from 'hls.js/src/utils/mp4-tools'

import { EventEmitter } from 'eventemitter3';

const defalutTypeSupported = {
  mp4: MediaSource.isTypeSupported('video/mp4'),
  mpeg: MediaSource.isTypeSupported('audio/mpeg'),
  mp3: MediaSource.isTypeSupported('audio/mp4; codecs="mp3"'),
};

export default class M2TStoFMP4 {
  private hlsEventEmitter = new EventEmitter();
  private hlsConfig = hlsDefaultConfig;
  private typeSupported = defalutTypeSupported;
  private demuxer!: TSDemuxer;
  private remuxer!: MP4Remuxer;

  public constructor(hlsConfig?, typeSupported?) {
    this.hlsConfig = {
      ... hlsDefaultConfig,
      ... hlsConfig
    };
    this.typeSupported = {
      ... defalutTypeSupported,
      ... typeSupported
    };

    this.demuxer = new TSDemuxer(this.hlsEventEmitter, this.hlsConfig, this.typeSupported);
    this.remuxer = new MP4Remuxer(this.hlsEventEmitter, this.hlsConfig, this.typeSupported);

    this.initialize()
  }  

  public initialize(): void {
    this.demuxer.resetInitSegment(undefined, undefined, Number.MIN_VALUE);
    this.demuxer.resetTimeStamp();
  }

  public transmux(chunk: Uint8Array) {
    const demux_result = this.demuxer.demux(chunk, 0);
    const remux_result = this.remuxer.remux(
      demux_result.audioTrack,
      demux_result.avcTrack,
      demux_result.id3Track,
      demux_result.textTrack,
      0, false, false
    );
    return remux_result;
  }

  public getHlsEventEmitter () {
    return this.hlsEventEmitter;
  }

  public getTSDemuxer() {
    return this.demuxer;
  }

  public getMP4Remuxer() {
    return this.remuxer;
  }

  public static isSupported(): boolean {
    return Hls.isSupported();
  }

  public static appendUint8Array(data1: Uint8Array, data2: Uint8Array): Uint8Array {
    return appendUint8Array(data1, data2);
  }
}
