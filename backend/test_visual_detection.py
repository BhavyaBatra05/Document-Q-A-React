import fitz  # PyMuPDF
import sys

def test_visual_detection(pdf_path):
    try:
        doc = fitz.open(pdf_path)
        print(f"Document loaded: {pdf_path}")
        print(f"Total pages: {len(doc)}")

        total_images = 0
        for i in range(len(doc)):
            page = doc.load_page(i)
            images = page.get_images()
            print(f"Page {i+1} has {len(images)} images")
            total_images += len(images)

        doc.close()
        print(f"Total images found in document: {total_images}")

        if total_images > 0:
            print("Visuals detected: YES")
        else:
            print("Visuals detected: NO")

    except Exception as e:
        print(f"Error opening or processing PDF: {str(e)}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_visual_detection.py your_file.pdf")
        sys.exit(1)

    test_visual_detection(sys.argv[1])
