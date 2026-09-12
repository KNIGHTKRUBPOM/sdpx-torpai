class DomainError(Exception):
    def __init__(self, code: str, message: str, status_code: int) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


def conflict(code: str, message: str) -> DomainError:
    return DomainError(code, message, 409)


def forbidden(code: str, message: str) -> DomainError:
    return DomainError(code, message, 403)


def not_found(code: str, message: str) -> DomainError:
    return DomainError(code, message, 404)
