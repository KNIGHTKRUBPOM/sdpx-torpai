import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from src.logger import logger, request_id_var


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        req_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        token = request_id_var.set(req_id)
        request.state.request_id = req_id

        start_time = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            route = request.scope.get("route")
            path_pattern = getattr(route, "path", request.url.path)
            logger.error(
                "http_request_failed",
                requestId=req_id,
                method=request.method,
                path=path_pattern,
                statusCode=500,
                duration_ms=duration_ms,
                error=str(exc),
            )
            request_id_var.reset(token)
            raise exc

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        response.headers["x-request-id"] = req_id

        # Use route pattern if available (e.g. /api/books/{book_id}) to prevent cardinality explosion
        route = request.scope.get("route")
        path_pattern = getattr(route, "path", request.url.path)
        user_id = getattr(request.state, "user_id", None)

        logger.info(
            "http_request",
            requestId=req_id,
            method=request.method,
            path=path_pattern,
            statusCode=response.status_code,
            duration_ms=duration_ms,
            userId=user_id,
        )

        request_id_var.reset(token)
        return response
