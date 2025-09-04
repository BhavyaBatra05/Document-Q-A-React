# app/services/document_processor.py
import os
import asyncio
from pathlib import Path
from typing import Dict, Any, List
import logging

# Import your enhanced_doc_qa functions
from app.core.document_qa import (
    SmartDocumentProcessor,
    has_visual_content_comprehensive
)

# Setup AI models
from app.config import settings
from langchain_google_genai import ChatGoogleGenerativeAI

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize AI models
async def init_models():
    try:
        llm = ChatGoogleGenerativeAI(model='gemini-1.5-flash', google_api_key=settings.GEMINI_API_KEY)
        
        # Lazily import and initialize VLM models only if needed
        vlm_processor = None
        vlm_model = None
        
        if settings.HUGGINGFACE_API_KEY:
            try:
                from transformers import AutoProcessor, AutoModelForVision2Seq
                vlm_processor = AutoProcessor.from_pretrained(
                    "HuggingFaceTB/SmolVLM-256M-Instruct", 
                    token=settings.HUGGINGFACE_API_KEY
                )
                vlm_model = AutoModelForVision2Seq.from_pretrained(
                    "HuggingFaceTB/SmolVLM-256M-Instruct", 
                    token=settings.HUGGINGFACE_API_KEY
                )
            except Exception as e:
                logger.error(f"Failed to load VLM models: {e}")
        
        return {
            "llm": llm,
            "vlm_processor": vlm_processor,
            "vlm_model": vlm_model
        }
    except Exception as e:
        logger.error(f"Error initializing AI models: {e}")
        return {
            "llm": None,
            "vlm_processor": None,
            "vlm_model": None
        }

# Initialize global models dict
_models = None

async def get_models():
    global _models
    if _models is None:
        _models = await init_models()
    return _models

async def process_document(file_path: str, file_ext: str) -> Dict[str, Any]:
    """Process document and extract information."""
    try:
        # Get AI models
        models = await get_models()
        llm = models["llm"]
        vlm_processor = models["vlm_processor"]
        vlm_model = models["vlm_model"]
        
        # Initialize document processor
        processor = SmartDocumentProcessor(
            llm=llm,
            vlm_processor=vlm_processor,
            vlm_model=vlm_model,
            batch_size=settings.BATCH_SIZE,
            max_workers=settings.MAX_WORKERS
        )
        
        # Extract text with visual content detection
        extraction_result = processor.extract_text_smart(file_path)
        
        # Create document info
        document_info = {
            "word_count": extraction_result.get("word_count", 0),
            "pages": extraction_result.get("pages", 1),
            "has_visual_content": extraction_result.get("has_visual_content", False),
            "visual_pages": extraction_result.get("visual_detection", {}).get("visual_pages", []),
            "extraction_method": extraction_result.get("extraction_method", "unknown"),
            "text": extraction_result.get("text", ""),
            "metadata": {
                "confidence": extraction_result.get("visual_detection", {}).get("confidence", 0.0),
                "visual_types": extraction_result.get("visual_detection", {}).get("visual_types", []),
                "detection_method": extraction_result.get("visual_detection", {}).get("detection_method", "unknown"),
            }
        }
        
        processor.cleanup()
        return document_info
        
    except Exception as e:
        logger.error(f"Document processing error: {e}")
        return {
            "word_count": 0,
            "pages": 1,
            "has_visual_content": False,
            "visual_pages": [],
            "extraction_method": "error",
            "text": "",
            "error": str(e),
            "metadata": {}
        }