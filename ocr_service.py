
# FILE: ocr_service.py



from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import easyocr
import fitz
import numpy as np
from PIL import Image


SUPPORTED_EXTENSIONS = {
    ".pdf",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".bmp",
    ".tif",
    ".tiff",
}


# ---------------------------------------------------------
# EASY OCR
# ---------------------------------------------------------

# Loaded once when this module starts.
# EasyOCR downloads its model the first time only.
_reader = easyocr.Reader(["en"])


# ---------------------------------------------------------
# TEXT CLEANING
# ---------------------------------------------------------

def _clean_text(text: str) -> str:
    text = text.replace("\x00", " ")

    text = re.sub(
        r"[ \t]+",
        " ",
        text,
    )

    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text,
    )

    return text.strip()


# ---------------------------------------------------------
# IMAGE OCR
# ---------------------------------------------------------

def _vision_ocr_image(image: Image.Image) -> str:
    """
    Extract text from an image using EasyOCR.

    No external API.
    No API key.
    No Gemini/OpenAI/Groq dependency.
    """

    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")

    result = _reader.readtext(
        np.array(image),
        detail=0,
    )

    text = "\n".join(result)

    return _clean_text(text)


# ---------------------------------------------------------
# DOCUMENT TEXT EXTRACTION
# ---------------------------------------------------------

def extract_document_text(
    file_path: str,
    filename: str,
) -> dict[str, Any]:

    suffix = Path(filename).suffix.lower()

    if suffix not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            "Unsupported document type. "
            "Use PDF, PNG, JPG, JPEG, WEBP, BMP, TIF, or TIFF."
        )

    # -----------------------------------------------------
    # IMAGE FILE
    # -----------------------------------------------------

    if suffix != ".pdf":

        with Image.open(file_path) as image:
            text = _vision_ocr_image(image)

        if not text:
            raise ValueError(
                "OCR could not extract readable text from this image."
            )

        return {
            "text": text,
            "page_count": 1,
            "ocr_used": True,
        }

    # -----------------------------------------------------
    # PDF FILE
    # -----------------------------------------------------

    doc = fitz.open(file_path)

    page_texts: list[str] = []
    ocr_used = False

    try:

        for page_number, page in enumerate(
            doc,
            start=1,
        ):

            # First try normal PDF text extraction.
            native_text = _clean_text(
                page.get_text("text")
            )

            # If the PDF already contains readable text,
            # don't waste OCR on it.
            if len(native_text) >= 20:

                page_texts.append(
                    f"[Page {page_number}]\n{native_text}"
                )

                continue

            # -------------------------------------------------
            # SCANNED / IMAGE PDF PAGE
            # -------------------------------------------------

            pixmap = page.get_pixmap(
                matrix=fitz.Matrix(
                    200 / 72,
                    200 / 72,
                ),
                alpha=False,
            )

            image = Image.frombytes(
                "RGB",
                (
                    pixmap.width,
                    pixmap.height,
                ),
                pixmap.samples,
            )

            ocr_text = _vision_ocr_image(image)

            ocr_used = True

            if ocr_text:

                page_texts.append(
                    f"[Page {page_number}]\n{ocr_text}"
                )

    finally:
        doc.close()

    text = _clean_text(
        "\n\n".join(page_texts)
    )

    if not text:

        raise ValueError(
            "Could not extract any readable text from this document."
        )

    return {
        "text": text,
        "page_count": len(page_texts),
        "ocr_used": ocr_used,
    }


# ---------------------------------------------------------
# DOCUMENT ANALYSIS
# ---------------------------------------------------------

def analyze_document(
    file_path: str,
    document_type: str = "auto",
    language: str = "eng",
) -> dict[str, Any]:

    path = Path(file_path)

    requested_type = (
        document_type or "auto"
    ).strip().lower()

    if requested_type not in {
        "auto",
        "syllabus",
        "pyq",
        "other",
    }:

        requested_type = "auto"

    extracted = extract_document_text(
        file_path,
        path.name,
    )

    text = extracted["text"]

    # -----------------------------------------------------
    # DETECT DOCUMENT TYPE
    # -----------------------------------------------------

    if requested_type == "auto":

        detected_type = detect_document_type(
            path.name,
            text,
        )

    else:

        detected_type = requested_type

    # -----------------------------------------------------
    # PARSE PYQ QUESTIONS
    # -----------------------------------------------------

    questions: list[dict[str, Any]] = []

    if detected_type == "pyq":

        questions = parse_question_blocks(
            text
        )

    return {
        "filename": path.name,
        "document_type": detected_type,
        "text": text,
        "questions": questions,
        "units": [],
        "page_count": extracted["page_count"],
        "ocr_used": extracted["ocr_used"],
    }


# ---------------------------------------------------------
# DOCUMENT TYPE DETECTION
# ---------------------------------------------------------

def detect_document_type(
    filename: str,
    text: str,
) -> str:

    name = filename.lower()

    sample = text[:12000].lower()

    syllabus_terms = [
        "syllabus",
        "course contents",
        "course content",
        "unit 1",
        "unit-1",
        "unit i",
        "module 1",
        "course outline",
        "curriculum",
    ]

    pyq_terms = [
        "question paper",
        "previous year",
        "previous years",
        "pyq",
        "end semester examination",
        "semester examination",
        "time: 3 hours",
        "max marks",
        "marks:",
        "q.1",
        "q1.",
        "question no",
    ]

    syllabus_score = (
        sum(
            term in name
            for term in syllabus_terms
        )
        * 3
        +
        sum(
            term in sample
            for term in syllabus_terms
        )
    )

    pyq_score = (
        sum(
            term in name
            for term in pyq_terms
        )
        * 3
        +
        sum(
            term in sample
            for term in pyq_terms
        )
    )

    if (
        syllabus_score > pyq_score
        and syllabus_score >= 2
    ):

        return "syllabus"

    if pyq_score >= 2:

        return "pyq"

    return "other"


# ---------------------------------------------------------
# PYQ QUESTION PARSER
# ---------------------------------------------------------

def parse_question_blocks(
    text: str,
) -> list[dict[str, Any]]:

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    question_pattern = re.compile(
        r"^(?:Q(?:uestion)?\.?\s*)?"
        r"(\d{1,3})\s*[.)\-:]\s*(.*)$",
        re.IGNORECASE,
    )

    sub_pattern = re.compile(
        r"^\(?([a-hA-H])\)?\s*[.)\-:]\s*(.*)$"
    )

    blocks: list[dict[str, Any]] = []

    current: dict[str, Any] | None = None

    current_page = 1

    for line in lines:

        # -------------------------------------------------
        # PAGE MARKER
        # -------------------------------------------------

        page_marker = re.fullmatch(
            r"\[Page\s+(\d+)\]",
            line,
            re.IGNORECASE,
        )

        if page_marker:

            current_page = int(
                page_marker.group(1)
            )

            continue

        # -------------------------------------------------
        # MAIN QUESTION
        # -------------------------------------------------

        match = question_pattern.match(line)

        if match:

            if (
                current
                and current["text"].strip()
            ):

                blocks.append(current)

            current = {
                "number": match.group(1),
                "text": match.group(2).strip(),
                "page": current_page,
            }

            continue

        # -------------------------------------------------
        # SUB QUESTION
        # -------------------------------------------------

        sub_match = sub_pattern.match(line)

        if (
            sub_match
            and current
        ):

            parent_number = (
                current["number"]
                .split("(", 1)[0]
            )

            if current["text"].strip():

                blocks.append(current)

            current = {
                "number": (
                    f"{parent_number}"
                    f"({sub_match.group(1).lower()})"
                ),
                "text": sub_match.group(2).strip(),
                "page": current_page,
            }

            continue

        # -------------------------------------------------
        # CONTINUATION OF CURRENT QUESTION
        # -------------------------------------------------

        if current:

            current["text"] += (
                " " + line
            )

    # -----------------------------------------------------
    # LAST QUESTION
    # -----------------------------------------------------

    if (
        current
        and current["text"].strip()
    ):

        blocks.append(current)

    # -----------------------------------------------------
    # CLEAN RESULTS
    # -----------------------------------------------------

    cleaned: list[dict[str, Any]] = []

    for block in blocks:

        text_value = _clean_text(
            block["text"]
        )

        if len(text_value) >= 5:

            cleaned.append(
                {
                    "number": block["number"],
                    "text": text_value,
                    "page": block.get(
                        "page",
                        1,
                    ),
                }
            )

    return cleaned[:300]