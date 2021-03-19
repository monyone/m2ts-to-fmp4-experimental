import TSDemuxer from 'hls.js/src/demux/tsdemuxer';
import MP4Remuxer from 'hls.js/src/remux/mp4-remuxer';

import Hls from 'hls.js';
import { hlsDefaultConfig } from 'hls.js/src/config';

import { EventEmitter } from 'eventemitter3';

const defalutTypeSupported = {
  mp4: MediaSource.isTypeSupported('video/mp4'),
  mpeg: MediaSource.isTypeSupported('audio/mpeg'),
  mp3: MediaSource.isTypeSupported('audio/mp4; codecs="mp3"'),
};

export default class M2TStoFMP4 {
  private hlsEventEmitter = new EventEmitter();
  private hlsConfig!;
  private typeSupported!;
  private demuxer!;
  private remuxer!;

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
  }  

  public initialize(): void {
    this.demuxer.resetInitSegment(undefined, undefined, true);
    this.demuxer.resetTimeStamp();
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

  public static isSupported() {
    return Hls.isSupported();    
  }
}
