"""
Обработчики исключений
"""
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from loguru import logger


def setup_exception_handlers(app: FastAPI):
    """Настройка обработчиков исключений"""
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        logger.error(f"HTTP Exception: {exc.status_code} - {exc.detail}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "message": exc.detail,
                "status_code": exc.status_code
            }
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unexpected error: {str(exc)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Внутренняя ошибка сервера",
                "status_code": 500
            }
        ) 