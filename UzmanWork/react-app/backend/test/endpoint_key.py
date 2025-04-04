from pydantic import BaseModel


# FastAPI endpoints can be uniquely identified by their path and methods
class EndpointKey(BaseModel):
    path: str
    methods: set[str]

    @classmethod
    def Get(cls, path: str) -> "EndpointKey":
        return cls(path=path, methods={"GET"})

    @classmethod
    def Post(cls, path: str) -> "EndpointKey":
        return cls(path=path, methods={"POST"})

    @classmethod
    def Put(cls, path: str) -> "EndpointKey":
        return cls(path=path, methods={"PUT"})

    @classmethod
    def Delete(cls, path: str) -> "EndpointKey":
        return cls(path=path, methods={"DELETE"})

    @classmethod
    def Patch(cls, path: str) -> "EndpointKey":
        return cls(path=path, methods={"PATCH"})

    def __hash__(self) -> int:
        return hash((self.path, frozenset(self.methods)))
