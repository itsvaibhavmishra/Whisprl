export const fileFromBlobUrl = async (blobUrl, name) => {
  const blob = await (await fetch(blobUrl)).blob();
  return new File([blob], name, { type: blob.type });
};
