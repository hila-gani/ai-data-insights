from pydantic import BaseModel

class AskRequest(BaseModel):
    """
    Request model for the /ask endpoint.
    Contains a single field: the user's natural-language question.
    """
    question: str
