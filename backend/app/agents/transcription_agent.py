"""
Transcription Agent — processes audio streams and produces annotated transcripts
with speaker diarization and financial terminology tuning.

In production this wraps Azure Speech SDK streaming. For demo purposes
the agent also handles text-based transcript enrichment (punctuation,
speaker labels, financial term normalization).
"""
from __future__ import annotations

import base64
import logging
from typing import Any, Optional

from backend.app.agents.base_agent import FoundryAgentBase
from backend.config import get_settings

logger = logging.getLogger(__name__)


class TranscriptionAgent(FoundryAgentBase):
    AGENT_ID = "agent_transcription"
    AGENT_NAME = "CapmarketTranscriptionAgent"
    MODEL_DEPLOYMENT = ""
    _MODEL_SETTINGS_KEY = "agent_transcription_model"

    SYSTEM_PROMPT = """You are an expert financial transcription specialist.

Your tasks:
1. Receive partial or complete meeting transcript text.
2. Normalize financial terminology (ETF, CPI, YTD, P/E, etc.).
3. Identify and label speakers as ADVISOR or CLIENT based on context clues.
4. Flag compliance-sensitive phrases (guaranteed returns, insider info, unsuitable products).
5. Extract mentioned financial instruments, products, and entities.

Always respond in JSON with this exact schema:
{
  "segments": [
    {
      "speaker": "advisor|client|unknown",
      "text": "...",
      "normalized_text": "...",
      "confidence": 0.0-1.0,
      "compliance_flags": [],
      "entities": []
    }
  ],
  "meeting_topics": [],
  "compliance_alerts": []
}"""

    def enrich_transcript(self, raw_text: str, context: Optional[str] = None) -> dict[str, Any]:
        """
        Enrich a raw transcript chunk with speaker labels, normalization, and compliance flags.
        """
        prompt = f"""Enrich the following meeting transcript excerpt.
Context: {context or 'Financial advisor-client meeting'}

Transcript:
{raw_text}

Apply speaker diarization, normalize financial terms, flag compliance issues,
and extract mentioned entities (stocks, funds, strategies, products)."""
        return self.run(prompt)

    def transcribe_audio_segment(
        self, audio_base64: str, speaker_hint: str = "unknown"
    ) -> dict[str, Any]:
        """
        Transcribe a base64-encoded audio segment using the Azure Speech REST API.

        The browser MediaRecorder produces audio/webm;codecs=opus.  The Speech
        SDK's PushAudioInputStream defaults to raw PCM and silently produces
        empty results for WebM.  The REST API accepts WebM/Opus natively and is
        the correct path for browser audio chunks.
        """
        settings = get_settings()
        if not settings.azure_speech_key:
            return {
                "segments": [],
                "error": "Azure Speech not configured — set AZURE_SPEECH_KEY",
            }

        try:
            import httpx

            audio_bytes = base64.b64decode(audio_base64)
            if len(audio_bytes) < 100:
                return {"segments": []}

            url = (
                f"https://{settings.azure_speech_region}.stt.speech.microsoft.com"
                "/speech/recognition/conversation/cognitiveservices/v1"
            )
            headers = {
                "Ocp-Apim-Subscription-Key": settings.azure_speech_key,
                # WebM/Opus is the native output of browser MediaRecorder
                "Content-Type": "audio/webm;codecs=opus",
                "Accept": "application/json",
            }
            params = {
                "language": "en-US",
                "format": "simple",
                "profanity": "masked",
            }
            resp = httpx.post(
                url,
                headers=headers,
                params=params,
                content=audio_bytes,
                timeout=15.0,
            )
            data = resp.json()
            logger.info(
                "speech_rest_response status=%s body=%s audio_bytes=%d",
                data.get("RecognitionStatus"),
                str(data)[:200],
                len(audio_bytes),
            )
            display_text = data.get("DisplayText", "")
            if not display_text:
                return {"segments": []}

            # Return transcribed text directly — no LLM enrichment in the
            # real-time path.  Enrichment in the hot path (per audio chunk)
            # adds 2-5 s latency and drops the segment if the LLM call fails.
            # Speaker labelling / compliance checks occur downstream in
            # process_transcript_chunk (PII → sentiment → profile extraction).
            return {
                "segments": [
                    {
                        "speaker": speaker_hint,
                        "text": display_text,
                        "normalized_text": display_text,
                        "confidence": data.get("NBest", [{}])[0].get("Confidence", 0.95) if data.get("NBest") else 0.95,
                        "compliance_flags": [],
                        "entities": [],
                    }
                ],
                "meeting_topics": [],
                "compliance_alerts": [],
            }

        except Exception as exc:
            logger.error("transcription_failed error=%s", str(exc))
            return {"segments": [], "error": str(exc)}
