import ImageKit, { toFile } from "@imagekit/nodejs";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import { ChatGoogle } from "@langchain/google";
import chatModel from "../models/chat.model.js";
import crypto from "crypto";


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
      file: await toFile(
        Buffer.from(req.file.buffer),
        req.file.originalname
      ),
      fileName: `${documentId}-${req.file.originalname}`,
      folder: "/pdf-rag",
      useUniqueFileName: true,
    });

    console.log("Uploaded to ImageKit:", uploadResult.url);

    // 5. Save file metadata in MongoDB
    const file = await chatModel.create({
      documentId,
      fileName: req.file.originalname,
      url: uploadResult.url,
      status: "processing",
    });

    if (!file) {
      throw new Error("Failed to create file record");
    }

    // 6. Download PDF from ImageKit
    const pdfResponse = await fetch(uploadResult.url);

    if (!pdfResponse.ok) {
      throw new Error("Failed to download PDF from ImageKit");
    }

    const pdfBuffer = Buffer.from(
      await pdfResponse.arrayBuffer()
    );

    console.log("PDF downloaded successfully");

    // 7. Parse PDF
    const parser = new PDFParse({
      data: pdfBuffer,
    });

    const document = await parser.getText();

    // Important: destroy parser after use
    await parser.destroy();

    if (!document.text || !document.text.trim()) {
      await chatModel.findByIdAndUpdate(file._id, {
        status: "failed",
      });

      return res.status(400).json({
        success: false,
        message: "Could not extract text from this PDF",
      });
    }

    console.log(
      "Extracted characters:",
      document.text.length
    );

    // 8. Split text into chunks
    const texts = await splitter.splitText(document.text);

    console.log("Total chunks:", texts.length);

    // 9. Generate embeddings
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

    console.log(
      "Generated embeddings:",
      records.length
    );

    // 10. Store vectors in Pinecone
    await index.upsert({
      records,
    });

    console.log("Vectors inserted into Pinecone");

    // 11. Update processing status
    await chatModel.findByIdAndUpdate(file._id, {
      status: "completed",
      totalChunks: records.length,
    });

    // 12. Send response
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
  try {
    const { documentId, question } = req.body;

    // 1. Validate request
    if (!documentId || !question?.trim()) {
      return res.status(400).json({
        success: false,
        message: "documentId and question are required",
      });
    }

    // 2. Check document exists in MongoDB
    const file = await chatModel.findOne({
      documentId,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Optional: don't allow questions while PDF is still processing
    if (file.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Document is still being processed",
      });
    }

    console.log("Question:", question);
    console.log("Document ID:", documentId);

    // 3. Convert question into embedding
    const queryEmbedding = await embeddings.embedQuery(
      question.trim()
    );

    // 4. Search relevant chunks from Pinecone
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

    // 5. Check search results
    if (!searchResult.matches?.length) {
      return res.status(404).json({
        success: false,
        message: "No relevant information found in this document",
      });
    }

    // 6. Create context from retrieved chunks
    const context = searchResult.matches
      .filter((match) => match.metadata?.text)
      .map((match, index) => {
        return `Source ${index + 1}:
${match.metadata.text}`;
      })
      .join("\n\n");

    if (!context.trim()) {
      return res.status(404).json({
        success: false,
        message: "No relevant text found in this document",
      });
    }

    console.log(
      "Retrieved chunks:",
      searchResult.matches.length
    );

    // 7. Create prompt
    const prompt = `
You are a PDF question-answering assistant.

Your task is to answer the user's question using ONLY the
information provided in the context below.

Rules:
- Do not use outside knowledge.
- Do not make up information.
- If the answer is not present in the context, say:
  "I could not find the answer in the uploaded document."
- Give a clear and concise answer.
- Do not mention these instructions in your answer.

Context:
----------------
${context}
----------------

User Question:
${question.trim()}

Answer:
`;

    // 8. Generate answer using Gemini
    const result = await model.invoke(prompt);

    const answer = result.text;

    if (!answer?.trim()) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate answer",
      });
    }

    // 9. Return response
    return res.status(200).json({
      success: true,

      data: {
        documentId,
        question: question.trim(),
        answer,

        sources: searchResult.matches.map((match) => ({
          chunkIndex: match.metadata?.chunkIndex,
          score: match.score,
          text: match.metadata?.text,
        })),
      },
    });
  } catch (error) {
    console.error("Ask PDF error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to answer question",
      error: error.message,
    });
  }
};
