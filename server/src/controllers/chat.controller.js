import ImageKit, { toFile } from "@imagekit/nodejs";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

const index = pc.index("pdf-rag")

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

  console.log(result.url);
  const parser = new PDFParse(result);

  const document = await parser.getText();

  const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "gemini-embedding-001",
  outputDimensionality: 1024, 
});

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 0,
  });

  const texts = await splitter.splitText(document.text);

  const docs = await Promise.all(
  texts.map(async (chunk) => {
    const embedding = await embeddings.embedQuery(chunk, {
      output_dimensionality: 1024,
    });
    return {
      text: chunk,
      embedding,
      dimensions: embedding.length 
    };
  }),
);

const response = await index.upsert({
  records: docs.map((doc, i)=> ({
    id: `doc-${i}`,
    value: doc.embedding,
    metadata: {
      text: doc.text
    }
  }))
})


  // Return the successful response with the ImageKit URL
  // res.status(200).json({
  //   success: true,
  //   url: result.url,
  //   fileId: result.fileId,
  // });
};
