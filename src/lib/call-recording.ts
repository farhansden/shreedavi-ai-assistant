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

function recorderMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export function hasPlaybackStream(session: object | null): boolean {
  if (!session) return false;
  const playback = (session as RecordableSession).output?.audioElement?.srcObject;
  return playback instanceof MediaStream;
}

export function releaseRecording(recording: CallRecording | null) {
  if (recording) URL.revokeObjectURL(recording.url);
}

export function startCallRecorder(session: object | null): ActiveRecorder | null {
  if (!session || typeof MediaRecorder === "undefined") return null;
  const streams = sessionStreams(session);
  if (streams.length === 0) return null;

  const context = new AudioContext();
  const destination = context.createMediaStreamDestination();
  const sources = streams.map((stream) => {
    const source = context.createMediaStreamSource(stream);
    source.connect(destination);
    return source;
  });
  void context.resume();

  const mimeType = recorderMimeType();
  const recorder = mimeType
    ? new MediaRecorder(destination.stream, { mimeType })
    : new MediaRecorder(destination.stream);
  const chunks: Blob[] = [];
  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  });
  recorder.start(1000);

  return {
    stop: () =>
      new Promise((resolve) => {
        const finish = () => {
          sources.forEach((source) => source.disconnect());
          void context.close();
          if (chunks.length === 0) {
            resolve(null);
            return;
          }
          const type = recorder.mimeType || mimeType || "audio/webm";
          const blob = new Blob(chunks, { type });
          const extension = type.includes("mp4") ? "m4a" : "webm";
          const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
          resolve({
            url: URL.createObjectURL(blob),
            filename: `shreedavi-call-${stamp}.${extension}`,
          });
        };

        if (recorder.state === "inactive") {
          finish();
          return;
        }
        recorder.addEventListener("stop", finish, { once: true });
        recorder.stop();
      }),
  };
}
