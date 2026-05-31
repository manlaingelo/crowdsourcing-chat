# Open-Source Crowd-RAG Chatbot: Architecture & Tech Stack

This document outlines the zero-cost, API-first hybrid architecture designed for this open-source multi-modal product search engine. The entire stack utilizes generous free-tier services to minimize operational costs while maintaining production-grade performance.

---

## 🏗️ System Architecture

The workflow leverages public cloud infrastructures for intensive AI computation and vector storage, keeping the orchestrating app lightweight and decoupled from local physical infrastructure limitations.

              ┌──────────────────────────────┐
              │   Vercel │ ──► [Frontend UI]|
              └──────────────────────────────┘
                             │
                             ▼ (HTTPS API Requests)
              ┌──────────────────────────────┐
              │     Hugging Face Spaces      │ ──► [ Backend Orchestrator ]
              └──────────────────────────────┘
                             │
     ┌───────────────────────┼───────────────────────┐
     ▼ (Vector Retrieval)    ▼ (AI Processing)       ▼ (Fallback Web Intel)


┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Qdrant Cloud   │    │ Google AI Studio │    │   Tavily API     │
│ (Managed Vector) │    │ (Gemini Engine)  │    │ (Pre-parsed Web) │
└──────────────────┘    └──────────────────┘    └──────────────────┘
│
▼ (Low confidence fallback triggers data contribution)
┌──────────────────┐
│    GitHub API    │ ──► [ Opens Data Pull Request ]
└──────────────────┘

---

## 🛠️ Tech Stack & Service Breakdown

| Layer | Selected Service | Cost | Function & Capabilities | Free Tier / Cap Constraints |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend UI** | **Vercel** | $0 | Hosts the user search panel, chat window, and image uploader. Built with Next.js or React. | Unlimited non-commercial hobby bandwidth. |
| **Backend Engine** | **Hugging Face Spaces** | $0 | Runs a Python FastAPI container. Acts as the orchestrator connecting the UI, vector DB, and APIs. | **Always-on** instance, 16GB RAM, 2 vCPUs (Shared CPU tier). |
| **Core LLM & OCR** | **Google AI Studio** (`gemini-2.5-flash`) | $0 | Generates conversational results. Its native multi-modality functions as the OCR engine to extract serial numbers or text from images. | 15 requests per minute (RPM), 1,500 requests per day (RPD). |
| **Multi-Modal Embeddings** | **Google AI Studio** (`gemini-embedding-2`) | $0 | Google's cross-modal model. Maps both plain text names/serial numbers and image bytes into a unified vector space. | Shares the unified Gemini free-tier bucket limit. |
| **Vector DB** | **Qdrant Cloud** / **Pinecone** | $0 | Stores and performs similarity searches on product vectors. | **Qdrant:** 1 free cluster, 1GB RAM (~20k-50k vectors). <br>**Pinecone:** Serverless tier (up to 100k vectors). |
| **Web Search API** | **Tavily API** / **Brave Search** | $0 | Fallback mechanism when vector search similarity scores drop below threshold limits. Returns clean text snippets. | **Tavily:** 1,000 search queries/month. <br>**Brave:** 1 request per second (RPS), 10,000 queries/month. |
| **Data Ledger (DB Source)** | Public **GitHub Repository** | $0 | Stores the structured product data files (`.json` format) directly under git control. | Unlimited free repositories for open-source projects. |

---

## 🔄 Core MVP Workflows

### 1. The Multi-Modal Retrieval Loop
1. The user uploads a product image or inputs a text name/serial number into the frontend.
2. The Hugging Face backend intercepts the payload and requests a vector representation from `gemini-embedding-2`.
3. The backend executes a nearest-neighbor query in the cloud vector database (Qdrant/Pinecone) using the vector.
4. If a matching product record is found with high confidence, the JSON metadata is retrieved and fed into `gemini-2.5-flash` to synthesize an informative answer.

### 2. The Web Fallback & Crowdsourcing Loop
1. If the vector database returns zero results or a confidence score below the threshold, the backend queries **Tavily API** for real-world web data.
2. `gemini-2.5-flash` processes the external web content, answers the user's immediate question, and flags that this product is missing from the local registry.
3. The UI presents an **"Improve Our Data"** form pre-filled with the extracted web attributes.
4. When submitted, the backend uses the **GitHub Octokit API** to automatically generate a formatted JSON file and open a Pull Request directly to the main code repository.
