export type CallRecording = {
  url: string;
  filename: string;
};

type RecordableSession = {
  input?: { inputStream?: MediaStream };
  output?: { audioElement?: HTMLAudioElement };
};

type ActiveRecorder = {
  stop: () => Promise<CallRecording | null>;
};

function sessionStreams(session: object): MediaStream[] {
  const record = session as RecordableSession;
  const streams: MediaStream[] = [];
  const microphone = record.input?.inputStream;
  if (microphone) streams.push(microphone);
  const playback = record.output?.audioElement?.srcObject;
  if (playback instanceof MediaStream) streams.push(playback);
  return streams;
}

export function hasPlaybackStream(session: object | null): boolean {
  if (!session) return false;
  const playback = (session as RecordableSession).output?.audioElement?.srcObject;
  return playback instanceof MediaStream;
}

export function releaseRecording(recording: CallRecording | null) {
  if (recording) URL.revokeObjectURL(recording.url);
}

function toPcm(input: AudioBuffer): Int16Array {
  const left = input.getChannelData(0);
  const right = input.numberOfChannels > 1 ? input.getChannelData(1) : null;
  const pcm = new Int16Array(left.length);
  for (let index = 0; index < left.length; index += 1) {
    const sample = right ? (left[index] + right[index]) / 2 : left[index];
    const clamped = Math.max(-1, Math.min(1, sample));
    pcm[index] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  return pcm;
}

function encodeWav(chunks: Int16Array[], sampleRate: number): Blob {
  let sampleCount = 0;
  for (const chunk of chunks) sampleCount += chunk.length;
  const dataSize = sampleCount * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const write = (offset: number, text: string) => {
    for (let index = 0; index < text.length; index += 1) {
      view.setUint8(offset + index, text.charCodeAt(index));
    }
  };

  write(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (const chunk of chunks) {
    for (let index = 0; index < chunk.length; index += 1) {
      view.setInt16(offset, chunk[index], true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export function startCallRecorder(session: object | null): ActiveRecorder | null {
  if (!session || typeof AudioContext === "undefined") return null;
  const streams = sessionStreams(session);
  if (streams.length === 0) return null;

  const context = new AudioContext();
  const mix = context.createGain();
  const capture = context.createScriptProcessor(4096, 2, 2);
  const silent = context.createGain();
  silent.gain.value = 0;
  const sources = streams.map((stream) => {
    const source = context.createMediaStreamSource(stream);
    source.connect(mix);
    return source;
  });
  mix.connect(capture);
  capture.connect(silent);
  silent.connect(context.destination);

  const chunks: Int16Array[] = [];
  capture.onaudioprocess = (event) => {
    chunks.push(toPcm(event.inputBuffer));
  };
  void context.resume();

  return {
    stop: () => {
      capture.onaudioprocess = null;
      capture.disconnect();
      silent.disconnect();
      mix.disconnect();
      sources.forEach((source) => source.disconnect());
      const sampleRate = context.sampleRate;
      void context.close();
      if (chunks.length === 0) return Promise.resolve(null);
      const blob = encodeWav(chunks, sampleRate);
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      return Promise.resolve({
        url: URL.createObjectURL(blob),
        filename: `shreedevi-call-${stamp}.wav`,
      });
    },
  };
}
