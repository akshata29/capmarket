"""
Audio file generator — converts scenario transcripts to WAV files using Azure TTS.

Each WAV file is a stereo (left=advisor, right=client) or interleaved mono audio
ready to feed directly to POST /api/meetings/{id}/audio/stream for real-time
transcription testing without a microphone.

Requirements:
    pip install azure-cognitiveservices-speech

Environment (same as backend .env):
    AZURE_SPEECH_KEY     Your Azure Speech Services key
    AZURE_SPEECH_REGION  Region (e.g. eastus)

Usage:
    # Generate WAV for one scenario
    python tests/generate_audio.py sarah_chen

    # Generate WAV for all scenarios
    python tests/generate_audio.py --all

    # Output to a custom directory
    python tests/generate_audio.py sarah_chen --out D:/test-audio

    # Play back immediately (requires ffplay or Windows Media Player)
    python tests/generate_audio.py sarah_chen --play

Output:
    tests/audio/<scenario_name>_advisor.wav   — advisor lines only
    tests/audio/<scenario_name>_client.wav    — client lines only
    tests/audio/<scenario_name>_mixed.wav     — interleaved (advisor + client)
"""
from __future__ import annotations

import argparse
import io
import os
import struct
import sys
from pathlib import Path

# Allow running from either project root or tests/ directory
sys.path.insert(0, str(Path(__file__).parent))

# Azure TTS voices — differentiate advisor and client
ADVISOR_VOICE = "en-US-GuyNeural"        # calm, professional male
CLIENT_VOICES = {
    # ── Original prospecting scenarios ────────────────────────────────────
    "sarah_chen":               "en-US-JennyNeural",
    "robert_linda_hayes":       "en-US-ChristopherNeural",   # Robert's voice
    "marcus_williams":          "en-US-DavisNeural",
    "jennifer_reyes":           "en-US-AmberNeural",
    "david_huang":              "en-US-BrianNeural",
    "dr_priya_patel":           "en-US-NancyNeural",
    "george_patricia_sullivan": "en-US-TonyNeural",          # George's voice
    # ── Sarah Chen journey — meetings M2-M6 ──────────────────────────────
    "sarah_chen_m2_onboarding":      "en-US-JennyNeural",
    "sarah_chen_m3_market_downturn": "en-US-JennyNeural",
    "sarah_chen_m4_engagement":      "en-US-JennyNeural",    # Sarah primary
    "sarah_chen_m5_annual_review":   "en-US-JennyNeural",    # Sarah primary
    "sarah_chen_m6_expecting":       "en-US-JennyNeural",    # Sarah primary
    # ── Hayes journey — meetings M2-M6 (Robert primary) ──────────────────
    "hayes_m2_onboarding":           "en-US-ChristopherNeural",
    "hayes_m3_health_scare":         "en-US-ChristopherNeural",
    "hayes_m4_linda_retirement":     "en-US-ChristopherNeural",
    "hayes_m5_annual_review":        "en-US-ChristopherNeural",
    "hayes_m6_robert_retires":       "en-US-ChristopherNeural",
    # ── Williams journey — meetings M2-M6 ────────────────────────────────
    "williams_m2_onboarding":        "en-US-DavisNeural",
    "williams_m3_acquirer_crisis":   "en-US-DavisNeural",
    "williams_m4_new_venture":       "en-US-DavisNeural",
    "williams_m5_annual_review":     "en-US-DavisNeural",
    "williams_m6_secondary_sale":    "en-US-DavisNeural",
    # ── Reyes journey — meetings M2-M6 ───────────────────────────────────
    "reyes_m2_onboarding":           "en-US-AmberNeural",
    "reyes_m3_career_pivot":         "en-US-AmberNeural",
    "reyes_m4_emma_college":         "en-US-AmberNeural",
    "reyes_m5_annual_review":        "en-US-AmberNeural",
    "reyes_m6_new_relationship":     "en-US-AmberNeural",
    # ── Huang journey — meetings M2-M6 (David primary) ───────────────────
    "huang_m2_onboarding":           "en-US-BrianNeural",
    "huang_m3_home_closing":         "en-US-BrianNeural",
    "huang_m4_baby_announcement":    "en-US-BrianNeural",
    "huang_m5_property_offer":       "en-US-BrianNeural",
    "huang_m6_startup_windfall":     "en-US-BrianNeural",
    # ── Patel journey — meetings M2-M6 ───────────────────────────────────
    "patel_m2_onboarding":           "en-US-NancyNeural",
    "patel_m3_partnership_buyin":    "en-US-NancyNeural",
    "patel_m4_annual_review":        "en-US-NancyNeural",
    "patel_m5_vikram_business":      "en-US-NancyNeural",
    "patel_m6_partner_exit":         "en-US-NancyNeural",
    # ── Sullivan journey — meetings M2-M6 (George primary) ───────────────
    "sullivan_m2_onboarding":        "en-US-TonyNeural",
    "sullivan_m3_patricia_retires":  "en-US-TonyNeural",
    "sullivan_m4_condo_sale":        "en-US-TonyNeural",
    "sullivan_m5_annual_review":     "en-US-TonyNeural",
    "sullivan_m6_ltc_discussion":    "en-US-TonyNeural",
}

# Secondary client voices for joint/couple meetings.
# When two consecutive "client" turns appear without an advisor turn between
# them, the second turn is synthesized with this secondary voice.
# Keyed by scenario name — falls back to a generic secondary if not listed.
SECONDARY_CLIENT_VOICES: dict[str, str] = {
    # Sarah Chen arc — Michael Torres (M4-M6)
    "sarah_chen_m4_engagement":      "en-US-BrianNeural",
    "sarah_chen_m5_annual_review":   "en-US-BrianNeural",
    "sarah_chen_m6_expecting":       "en-US-BrianNeural",
    # Hayes arc — Linda Hayes (all joint meetings M2-M6)
    "hayes_m2_onboarding":           "en-US-ElizabethNeural",
    "hayes_m3_health_scare":         "en-US-ElizabethNeural",
    "hayes_m4_linda_retirement":     "en-US-ElizabethNeural",
    "hayes_m5_annual_review":        "en-US-ElizabethNeural",
    "hayes_m6_robert_retires":       "en-US-ElizabethNeural",
    # Huang arc — Amy Huang (M2 onboarding and M4 baby)
    "huang_m2_onboarding":           "en-US-SaraNeural",
    "huang_m4_baby_announcement":    "en-US-SaraNeural",
    # Sullivan arc — Patricia Sullivan (all joint meetings M2-M6)
    "sullivan_m2_onboarding":        "en-US-MonicaNeural",
    "sullivan_m3_patricia_retires":  "en-US-MonicaNeural",
    "sullivan_m4_condo_sale":        "en-US-MonicaNeural",
    "sullivan_m5_annual_review":     "en-US-MonicaNeural",
    "sullivan_m6_ltc_discussion":    "en-US-MonicaNeural",
}

# Scenarios where a second client voice needs to be applied.
# Detected by two consecutive "client" turns (no "advisor" turn between them).
DUAL_CLIENT_SCENARIOS = {
    # Sarah Chen arc
    "sarah_chen_m4_engagement",
    "sarah_chen_m5_annual_review",
    "sarah_chen_m6_expecting",
    # Hayes arc — Robert and Linda both present in all follow-up meetings
    "hayes_m2_onboarding",
    "hayes_m3_health_scare",
    "hayes_m4_linda_retirement",
    "hayes_m5_annual_review",
    "hayes_m6_robert_retires",
    # Huang arc — Amy present in onboarding and baby announcement
    "huang_m2_onboarding",
    "huang_m4_baby_announcement",
    # Sullivan arc — George and Patricia both present in all follow-up meetings
    "sullivan_m2_onboarding",
    "sullivan_m3_patricia_retires",
    "sullivan_m4_condo_sale",
    "sullivan_m5_annual_review",
    "sullivan_m6_ltc_discussion",
}

# 16 kHz / 16-bit / mono — matches PushAudioInputStream expectations
SAMPLE_RATE   = 16000
BITS          = 16
CHANNELS      = 1
PAUSE_SAMPLES = SAMPLE_RATE // 2   # 500 ms silence between turns


def _load_dotenv() -> None:
    """Load variables from the project root .env into os.environ (no dependencies)."""
    env_path = Path(__file__).parent.parent / ".env"
    if not env_path.exists():
        return
    with open(env_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            os.environ.setdefault(key.strip(), val.strip())


def _get_speech_config() -> "speechsdk.SpeechConfig":
    import azure.cognitiveservices.speech as speechsdk  # type: ignore[import]

    _load_dotenv()
    key    = os.environ.get("AZURE_SPEECH_KEY",    "")
    region = os.environ.get("AZURE_SPEECH_REGION", "eastus")
    if not key:
        raise EnvironmentError(
            "AZURE_SPEECH_KEY not set. Add it to your .env file:\n"
            "  AZURE_SPEECH_KEY=your-key\n"
            "  AZURE_SPEECH_REGION=eastus"
        )
    cfg = speechsdk.SpeechConfig(subscription=key, region=region)
    cfg.set_speech_synthesis_output_format(
        speechsdk.SpeechSynthesisOutputFormat.Raw16Khz16BitMonoPcm
    )
    return cfg


def _synth_to_pcm(text: str, voice: str, cfg: "speechsdk.SpeechConfig") -> bytes:
    """Return raw 16 kHz 16-bit mono PCM bytes for a text string."""
    import azure.cognitiveservices.speech as speechsdk  # type: ignore[import]

    synth  = speechsdk.SpeechSynthesizer(speech_config=cfg, audio_config=None)
    ssml = (
        f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">'
        f'<voice name="{voice}">{text}</voice></speak>'
    )
    result = synth.speak_ssml_async(ssml).get()

    if result.reason != speechsdk.ResultReason.SynthesizingAudioCompleted:
        print(f"    [WARN] TTS failed for text: {text[:60]!r}", file=sys.stderr)
        return b""

    return result.audio_data


def _silence(samples: int) -> bytes:
    return b"\x00\x00" * samples   # 16-bit zero samples


def _write_wav(pcm: bytes, path: Path) -> None:
    """Wrap raw PCM in a minimal RIFF/WAV header and write to path."""
    data_size   = len(pcm)
    header_size = 44
    with open(path, "wb") as f:
        f.write(b"RIFF")
        f.write(struct.pack("<I", header_size - 8 + data_size))
        f.write(b"WAVE")
        f.write(b"fmt ")
        f.write(struct.pack("<IHHIIHH",
            16,           # subchunk1 size
            1,            # PCM
            CHANNELS,
            SAMPLE_RATE,
            SAMPLE_RATE * CHANNELS * BITS // 8,   # byte rate
            CHANNELS * BITS // 8,                  # block align
            BITS,
        ))
        f.write(b"data")
        f.write(struct.pack("<I", data_size))
        f.write(pcm)


def generate_scenario_audio(
    scenario_name: str,
    out_dir: Path,
) -> dict[str, Path]:
    """
    Synthesize all turns for a scenario.
    Returns dict of {role: wav_path}.

    For dual-client scenarios (meetings where Michael Torres also speaks),
    a second voice (MICHAEL_VOICE) is used for turns tagged "client_michael".
    All other non-advisor turns use the scenario's primary CLIENT_VOICES entry.
    """
    from scenarios.profiles import SCENARIOS

    if scenario_name not in SCENARIOS:
        raise ValueError(f"Unknown scenario: {scenario_name!r}.  "
                         f"Available: {list(SCENARIOS)}")

    segments = SCENARIOS[scenario_name]
    primary_client_voice = CLIENT_VOICES.get(scenario_name, "en-US-JennyNeural")
    secondary_voice = SECONDARY_CLIENT_VOICES.get(scenario_name, "en-US-BrianNeural")
    is_dual = scenario_name in DUAL_CLIENT_SCENARIOS

    cfg = _get_speech_config()
    out_dir.mkdir(parents=True, exist_ok=True)

    advisor_pcm: list[bytes] = []
    client_pcm:  list[bytes] = []
    mixed_pcm:   list[bytes] = []

    # Track which of the two consecutive "client" turns belongs to Michael.
    # In dual-client scenarios, every other consecutive client block alternates
    # between Sarah (primary) and Michael (secondary).
    michael_turn = False
    prev_speaker = None

    total = len(segments)
    for i, seg in enumerate(segments):
        speaker = seg["speaker"]
        text    = seg["text"]

        if speaker == "advisor":
            voice = ADVISOR_VOICE
            michael_turn = False    # reset after advisor speaks
        elif is_dual and speaker == "client":
            # Two consecutive "client" lines without an "advisor" line in between
            # signal the second speaker (Michael) in dual-client scenarios.
            if prev_speaker == "client":
                michael_turn = True
            else:
                michael_turn = False
            voice = secondary_voice if michael_turn else primary_client_voice
        else:
            voice = primary_client_voice

        label = speaker.upper() + (" [secondary]" if michael_turn and speaker == "client" else "")
        print(f"  [{i+1}/{total}] {label}: {text[:60]}…")

        prev_speaker = speaker
        pcm = _synth_to_pcm(text, voice, cfg)
        if not pcm:
            continue

        pause = _silence(PAUSE_SAMPLES)

        if speaker == "advisor":
            advisor_pcm.extend([pcm, pause])
            client_pcm.extend([_silence(len(pcm) // 2 + PAUSE_SAMPLES)])
        else:
            client_pcm.extend([pcm, pause])
            advisor_pcm.extend([_silence(len(pcm) // 2 + PAUSE_SAMPLES)])

        mixed_pcm.extend([pcm, pause])

    paths: dict[str, Path] = {}
    for role, chunks in [
        ("advisor", advisor_pcm),
        ("client",  client_pcm),
        ("mixed",   mixed_pcm),
    ]:
        if not chunks:
            continue
        raw  = b"".join(chunks)
        path = out_dir / f"{scenario_name}_{role}.wav"
        _write_wav(raw, path)
        paths[role] = path
        size_kb = len(raw) // 1024
        print(f"  Wrote {path.name}  ({size_kb} KB)")

    return paths


# ── CLI ────────────────────────────────────────────────────────────────────────

def main() -> None:
    from scenarios.profiles import SCENARIOS

    parser = argparse.ArgumentParser(description="Generate WAV audio files for meeting scenarios")
    parser.add_argument("scenario", nargs="?", help="Scenario name (omit for --all)")
    parser.add_argument("--all",  action="store_true", help="Generate audio for all scenarios")
    parser.add_argument("--out",  default="tests/audio",  help="Output directory (default: tests/audio)")
    parser.add_argument("--play", action="store_true",
                        help="Open the 'mixed' WAV with the system default player when done")
    args = parser.parse_args()

    out_dir = Path(args.out)

    names = list(SCENARIOS.keys()) if args.all else ([args.scenario] if args.scenario else [])
    if not names:
        parser.print_help()
        return

    for name in names:
        print(f"\n{'='*60}\nGenerating audio for: {name}\n{'='*60}")
        try:
            paths = generate_scenario_audio(name, out_dir)
            if args.play and "mixed" in paths:
                import subprocess
                subprocess.Popen(["cmd", "/c", "start", "", str(paths["mixed"])], shell=False)
        except Exception as exc:
            print(f"  ERROR: {exc}", file=sys.stderr)


if __name__ == "__main__":
    main()
