import { Injectable } from '@angular/core';

type AudioSegment = {
  tag: AudioTag,
  start: number,
  duration: number,
  defaultVolume: number,
  playbackRate?: number,
};

enum AudioTag {
  GenericSounds = 'generic-sounds',
  Track8BitLoop = 'track-8-bit-loop',
  JumpSound = 'jump-sound',
  Mistake = 'mistake',
  OhNoes = 'oh-noes',
  ShoveSound = 'shove',
  Countdown = 'countdown',
  Splosion = 'splosion',
  Rainbow = 'rainbow',
}

const BleepingSound: AudioSegment = {
  tag: AudioTag.GenericSounds,
  start: 0,
  duration: 500,
  defaultVolume: 1,
}

const RobotJump: AudioSegment = {
  tag: AudioTag.JumpSound,
  start: 0,
  duration: 500,
  defaultVolume: 0.1,
}

const RobotMovesSound: AudioSegment = {
  tag: AudioTag.GenericSounds,
  start: 1250,
  duration: 200,
  defaultVolume: 1,
}

const RejectionSound: AudioSegment = {
  tag: AudioTag.GenericSounds,
  start: 2700,
  duration: 300,
  defaultVolume: 1,
}

const Track8BitLoop: AudioSegment = {
  tag: AudioTag.Track8BitLoop,
  start: 0,
  duration: 32000,
  defaultVolume: 0.3,
}

const PlayerRobotDestroyed: AudioSegment = {
  tag: AudioTag.OhNoes,
  start: 200,
  duration: 3000,
  defaultVolume: 0.2,
  playbackRate: 1.4,
}

const PlayerFellInCrusher: AudioSegment = {
  tag: AudioTag.Mistake,
  start: 100,
  duration: 3000,
  defaultVolume: 0.6,
  playbackRate: 1.4,
}

const ShoveSound: AudioSegment = {
  tag: AudioTag.ShoveSound,
  start: 0,
  duration: 300,
  defaultVolume: 0.3,
  playbackRate: 2,
}

const Countdown: AudioSegment = {
  tag: AudioTag.Countdown,
  start: 0,
  duration: 4000,
  defaultVolume: 0.3,
}

const Splosion: AudioSegment = {
  tag: AudioTag.Splosion,
  start: 0,
  duration: 2000,
  defaultVolume: 0.25,
  playbackRate: 1.6,
}

const Rainbow: AudioSegment = {
  tag: AudioTag.Rainbow,
  start: 0,
  duration: 1000,
  defaultVolume: 0.8,
  playbackRate: 1.3,
}

const Track8BitLoopIntro: AudioSegment = {
  ...Track8BitLoop,
  start: 22000,
  duration: 10000,
}

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audioSources = new Map<AudioTag, HTMLAudioElement>();
  private playing = new Map<AudioSegment, HTMLAudioElement>();

  constructor() {
    this.pushAudioSource(AudioTag.GenericSounds, 'assets/audio/game-sounds.mp3');
    this.pushAudioSource(AudioTag.JumpSound, 'assets/audio/jump-sound.mp3');
    this.pushAudioSource(AudioTag.Track8BitLoop, 'assets/audio/track-8-bit-loop.mp3');
    this.pushAudioSource(AudioTag.OhNoes, 'assets/audio/oh-noes.mp3');
    this.pushAudioSource(AudioTag.Mistake, 'assets/audio/mistake.mp3');
    this.pushAudioSource(AudioTag.ShoveSound, 'assets/audio/shove.mp3');
    this.pushAudioSource(AudioTag.Countdown, 'assets/audio/countdown.mp3');
    this.pushAudioSource(AudioTag.Splosion, 'assets/audio/splosion.mp3');
    this.pushAudioSource(AudioTag.Rainbow, 'assets/audio/rainbow.mp3');
  }

  private pushAudioSource(tag: AudioTag, src: string): void {
    const audio = new Audio();
    audio.src = src;
    audio.load();
    audio.addEventListener('error', (e) => {
      console.error('Error loading audio source:', e);
    });
    this.audioSources.set(tag, audio);
  }

  private playSegment(segment: AudioSegment, volume = 1, loop = false){
    if (!this.playing.get(segment)) {
      const audio = this.audioSources.get(segment.tag);
      if (!audio) {
        throw new Error('Could not find audio source for segment.');
      }
      this.playing.set(segment, audio);
      const dynamicVolume = segment.defaultVolume * volume;
      audio.currentTime = segment.start / 1000; // Configured in milliseconds, provided in seconds
      audio.volume = dynamicVolume < 1 ? dynamicVolume : 1;
      if (segment.playbackRate) {
        audio.playbackRate = segment.playbackRate;
      }
      audio.play();
      setTimeout(() => {
        if (!loop) {
          audio.pause();
          this.playing.delete(segment);
        }
        audio.currentTime = 0;
      }, segment.duration);
    }
  }

  playTrack8BitLoopIntro() {
    this.playSegment(Track8BitLoopIntro);
  }

  playRobotMoves() {
    this.playSegment(RobotMovesSound);
  }

  playBleep() {
    this.playSegment(BleepingSound);
  }

  playRobotJump() {
    this.playSegment(RobotJump);
  }

  playRobotPushed() {
    this.playSegment(ShoveSound);
  }

  playRejectionSound() {
    this.playSegment(RejectionSound);
  }

  playCountdown() {
    this.playSegment(Countdown);
  }

  playPlayerRobotDestroyed() {
    this.playSegment(PlayerRobotDestroyed);
  }

  playRobotJumpsInCrusher() {
    this.playSegment(PlayerFellInCrusher);
  }

  playExplosion() {
    this.playSegment(Splosion);
  }

  playEnemyRobotSpawn() {
    this.playSegment(Rainbow);
  }
}
