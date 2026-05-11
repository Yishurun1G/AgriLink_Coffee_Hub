from docx import Document

def load_project_context():

    doc = Document("chatbot/data/agrilink_info.docx")

    text = []

    for para in doc.paragraphs:
        text.append(para.text)

    return "\n".join(text)