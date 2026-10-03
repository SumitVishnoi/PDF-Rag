import ImageKit, { toFile } from "@imagekit/nodejs";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import { ChatGoogle } from "@langchain/google";


const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pc.index("pdf-rag");

const client = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY, // This is the default and can be omitted
});

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "gemini-embedding-001",
  outputDimensionality: 1024,
});

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
});

const model = new ChatGoogle({
  model: "gemini-3.5-flash",
  apiKey: process.env.GOOGLE_API_KEY
});

export const createFile = async (req, res) => {
  try {
    // 1. Check file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No PDF file uploaded",
      });
    }

    // 2. Validate file type
    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({
        success: false,
        message: "Only PDF files are allowed",
      });
    }

    console.log("File received:", req.file.originalname);

    // 3. Generate unique document ID
    const documentId = crypto.randomUUID();

    // 4. Upload PDF to ImageKit
    const uploadResult = await client.files.upload({
      file: await toFile(Buffer.from(req.file.buffer), req.file.originalname),
      fileName: `${documentId}-${req.file.originalname}`,
      folder: "/pdf-rag",
      useUniqueFileName: true,
    });

    console.log("Uploaded to ImageKit:", uploadResult.url);

    const file = await 
    const pdfResponse = 

    if (!pdfResponse.ok) {
      throw new Error("Failed to download PDF from ImageKit");
    }

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

    // 6. Parse PDF
    const parser = new PDFParse({
      data: pdfBuffer,
    });

    const document = await parser.getText();

    // Important: destroy parser after use
    await parser.destroy();

    if (!document.text || !document.text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Could not extract text from this PDF",
      });
    }

    console.log("Extracted characters:", document.text.length);

    // 7. Split text into chunks
    const texts = await splitter.splitText(document.text);

    console.log("Total chunks:", texts.length);

    // 8. Generate embeddings
    const records = [];

    for (let i = 0; i < texts.length; i++) {
      const chunk = texts[i];

      const embedding = await embeddings.embedQuery(chunk);

      records.push({
        id: `${documentId}-chunk-${i}`,
        values: embedding,
        metadata: {
          documentId,
          fileName: req.file.originalname,
          text: chunk,
          chunkIndex: i,
          sourceUrl: uploadResult.url,
        },
      });
    }

    // 9. Store vectors in Pinecone
    await index.upsert({
      records,
    });

    console.log("Vectors inserted into Pinecone");

    // 10. Send response
    return res.status(201).json({
      success: true,
      message: "PDF processed successfully",
      data: {
        documentId,
        fileName: req.file.originalname,
        fileUrl: uploadResult.url,
        totalChunks: records.length,
      },
    });
  } catch (error) {
    console.error("PDF processing error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process PDF",
      error: error.message,
    });
  }
};

export const askFromPDF = async (req, res) => {
  const { documentId, question } = req.body;

  if (!documentId || !question?.trim()) {
    return res.status(400).json({
      success: false,
      message: "documentId and question are required",
    });
  }

  const queryEmbedding = await embeddings.embedQuery(question);

  const searchResult = await index.query({
    vector: queryEmbedding,
    topK: 5,
    includeMetadata: true,

    filter: {
      documentId: {
        $eq: documentId,
      },
    },
  });

  if (!searchResult.matches?.length) {
    return res.status(404).json({
      success: false,
      message: "No relevant information found in this document",
    });
  }

  const context = searchResult.matches
    .map((match, index) => {
      return `Source ${index + 1}:
${match.metadata?.text || ""}`;
    })
    .join("\n\n");

  // 6. Create prompt for Gemini
  const prompt = `
You are a PDF question-answering assistant.

Answer the user's question using ONLY the provided context.

If the answer cannot be found in the context, say:
"I could not find the answer in the uploaded document."

Do not make up information.

Context:
----------------
${context}
----------------

User Question:
${question}

Answer:
`;

  const result = await model.generateContent(prompt);

  const answer = result.response.text();

  // 8. Return response
  return res.status(200).json({
    success: true,
    data: {
      question,
      answer,
      sources: searchResult.matches.map((match) => ({
        chunkIndex: match.metadata?.chunkIndex,
        score: match.score,
        text: match.metadata?.text,
      })),
    },
  });
};
