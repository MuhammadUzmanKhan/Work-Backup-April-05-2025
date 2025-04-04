import fastapi
from pydantic import BaseModel


class ASGIScope(BaseModel):
    path: str
    type: str
    root_path: str
    # not defined for ws
    method: str | None = None

    def __hash__(self) -> int:
        return hash((self.path, self.method, self.type, self.root_path))


class RouteMatchContext(BaseModel):
    asgi_scope: ASGIScope
    routes: list[fastapi.routing.APIRoute | fastapi.routing.APIWebSocketRoute]

    class Config:
        arbitrary_types_allowed = True

    def __hash__(self) -> int:
        # NOTE(@lberg): we don't hash the routes as we don't expect them to change
        return hash((self.asgi_scope))


class SampleValue:
    IGNORED = 0.0
    SAMPLED = 0.01
    TAKEN = 1.0
