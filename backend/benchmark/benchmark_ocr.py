from difflib import SequenceMatcher

def accuracy(gt, pred):
    return SequenceMatcher(
        None,
        gt.lower(),
        pred.lower()
    ).ratio() * 100

with open(
    "benchmark/ground_truth.txt",
    encoding="utf-8"
) as f:
    gt = f.read()

with open(
    "benchmark/tesseract_output.txt",
    encoding="utf-8"
) as f:
    tess = f.read()

with open(
    "benchmark/easyocr_output.txt",
    encoding="utf-8"
) as f:
    easy = f.read()

print(
    f"Tesseract Accuracy: {accuracy(gt, tess):.2f}%"
)

print(
    f"EasyOCR Accuracy: {accuracy(gt, easy):.2f}%"
)