# app/services/qa_service.py
import os
import asyncio
from typing import Dict, Any, List, Optional
import logging

# Import your enhanced_doc_qa functions
from app.core.document_qa import (
    SmartDocumentProcessor,
    InMemoryVectorStore,
    HallucinationResistantAnswerer
)

# Import models
from app.services.document_processor import get_models

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Document cache
document_cache = {}

async def generate_answer(document_path: Optional[str], query: str) -> Dict[str, Any]:
    """Generate answer for a query using the document."""
    try:
        if not document_path or not os.path.exists(document_path):
            return {
                "answer": "I don't have a document to answer your question. Please upload a document first.",
                "confidence": 0.0,
                "sources_used": 0
            }
        
        # Get AI models
        models = await get_models()
        llm = models["llm"]
        
        # Check if document is already processed
        if document_path in document_cache:
            vectorstore = document_cache[document_path]
        else:
            # Process document and create vectorstore
            processor = SmartDocumentProcessor(
                llm=llm,
                vlm_processor=models["vlm_processor"],
                vlm_model=models["vlm_model"]
            )
            
            extraction_result = processor.extract_text_smart(document_path)
            processor.cleanup()
            
            if not extraction_result["success"]:
                return {
                    "answer": f"Failed to process document: {extraction_result.get('error', 'Unknown error')}",
                    "confidence": 0.0,
                    "sources_used": 0
                }
            
            # Create vector store
            vectorstore = InMemoryVectorStore()
            vs_result = vectorstore.create_vectorstore(extraction_result["text"])
            
            if not vs_result["success"]:
                return {
                    "answer": f"Failed to create vector index: {vs_result.get('error', 'Unknown error')}",
                    "confidence": 0.0,
                    "sources_used": 0
                }
            
            # Cache vectorstore
            document_cache[document_path] = vectorstore
        
        # Retrieve relevant chunks
        chunks = vectorstore.retrieve_chunks(query, k=6)
        
        # Generate answer
        answerer = HallucinationResistantAnswerer(llm=llm)
        answer_result = answerer.generate_answer(query, chunks)
        
        return {
            "answer": answer_result.get("answer", "No answer generated"),
            "confidence": answer_result.get("confidence", 0.0),
            "sources_used": answer_result.get("sources_used", 0),
            "context_length": answer_result.get("context_length", 0)
        }
        
    except Exception as e:
        logger.error(f"Error generating answer: {e}")
        return {
            "answer": f"Error generating answer: {str(e)}",
            "confidence": 0.0,
            "sources_used": 0
        }