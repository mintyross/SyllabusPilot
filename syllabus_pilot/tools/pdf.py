def read_pdf(file_path: str) -> str:
    """Extracts text content from a PDF file using pypdf."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(file_path)
        pages_text = [page.extract_text() or "" for page in reader.pages]
        return "\n--- Page Break ---\n".join(pages_text)
    except Exception as e:
        return f"Error reading PDF: {e}"
