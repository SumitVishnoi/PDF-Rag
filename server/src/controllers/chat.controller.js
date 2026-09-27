import ImageKit, { toFile } from "@imagekit/nodejs";

const client = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY, // This is the default and can be omitted
});

export const fileRelatedResponseGenerator = async (req, res) => {
  console.log(req.file);
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Upload the file buffer to ImageKit
  const result = await client.files.upload({
    file: await toFile(Buffer.from(req.file.buffer), "file"),
    fileName: "fileName",
  });

  // Return the successful response with the ImageKit URL
  res.status(200).json({
    success: true,
    url: result.url,
    fileId: result.fileId,
  });
};
