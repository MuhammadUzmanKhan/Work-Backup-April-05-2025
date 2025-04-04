from functools import partial

import fastapi

# NOTE(@lberg): By default FastAPI includes all fields in the response model,
# even if they are None. This is generally not an issue,
# but it conflicts with the frontend's expectations. The reason is that
# None is converted to undefined from specs, but is null in the actual response.
# Because the frontend is not doing parsing, this slips through and causes
# issues (e.g. comparing the value to undefined returns false).
# As such, we patch the router to exclude unset, default, and None fields from
# the response model. This also makes the response smaller, which is a nice.
# We do this in this weird way because FastAPI doesn't expose a way to
# replace the encoder it runs before generating the response.


class _WithResponseExcludeNone:
    def __init__(self) -> None:
        self.path_kwargs = {"response_model_exclude_none": True}

    def __call__(self, router: fastapi.APIRouter) -> fastapi.APIRouter:
        self._patch_routes(router)

        return router

    def _patch_routes(self, router: fastapi.APIRouter) -> None:
        router.get = partial(router.get, **self.path_kwargs)  # type: ignore
        router.post = partial(router.post, **self.path_kwargs)  # type: ignore
        router.put = partial(router.put, **self.path_kwargs)  # type: ignore
        router.delete = partial(router.delete, **self.path_kwargs)  # type: ignore
        router.patch = partial(router.patch, **self.path_kwargs)  # type: ignore


WithResponseExcludeNone = _WithResponseExcludeNone()
