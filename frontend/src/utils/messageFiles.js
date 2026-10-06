// a sender who closed the tab mid-upload never finishes, so after this the file is shown as not sent
const UPLOAD_GIVE_UP = 15 * 60 * 1000;

export const hasUploadStalled = (message) =>
  message.attachment?.status === "uploading" && Date.now() - new Date(message.createdAt).getTime() > UPLOAD_GIVE_UP;

// one shape for every file a bubble shows, whether it was sent encrypted or as a plain file before
export const filesOf = (message) => {
  if (!message.file) return message.files ?? [];

  const { file, attachment, clientId } = message;
  const isReady = attachment?.status === "ready";
  return [
    {
      fileName: file.name,
      fileType: file.kind,
      mimeType: file.mimeType,
      size: file.size,
      width: file.width,
      height: file.height,
      preview: file.preview,
      duration: file.duration,
      waveform: file.waveform,
      localId: clientId,
      sealed: isReady ? { url: attachment.url, key: file.key, iv: file.iv, mimeType: file.mimeType } : null,
      isUploading: !isReady,
      isLost: hasUploadStalled(message),
    },
  ];
};

export const isMediaFile = (file) => file.fileType === "image" || file.fileType === "video";

export const fileKeyOf = (file, index) => file.localId ?? file.sealed?.url ?? index;
