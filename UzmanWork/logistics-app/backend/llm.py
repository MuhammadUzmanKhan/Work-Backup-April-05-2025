import vertexai
from vertexai.preview.language_models import CodeGenerationModel, TextGenerationModel


class LargeLanguageModel:
    """A wrapper around the Vertex AI Large Language Model."""

    text_model: TextGenerationModel
    code_model: CodeGenerationModel

    def __init__(self) -> None:
        vertexai.init(project=None, location="us-central1", credentials=None)
        self.text_model = TextGenerationModel.from_pretrained("text-bison@001")
        self.code_model = CodeGenerationModel.from_pretrained("code-bison@001")

    def generate_text(self, prompt: str) -> str:
        return str(self.text_model.predict(prompt, temperature=0).text)

    def generate_code(self, prompt: str) -> str:
        return str(self.code_model.predict(prompt, temperature=0).text)
