import asyncio
import logging
import time
from functools import wraps
from typing import Any, Callable, Type

from backend import logging_config
from backend.database import models, orm
from backend.dependencies import (
    get_backend_database,
    get_backend_envs,
    get_slack_client,
)
from backend.instrumentation.utils import instrument_celery_tasks
from backend.monitor.alert import AlertSeverity, AlertTypeGrouped
from backend.monitor.alert_types import AlertType
from backend.task_worker.errors import TaskExecutionError

logger = logging.getLogger(logging_config.LOGGER_NAME)

SKIPPED_TASK = "SKIPPED"


class RetryError(Exception):
    pass


async def _send_error_alert(
    alert_type: AlertType, alert_severity: AlertSeverity, msg: str
) -> None:
    slack_client = get_slack_client()
    await slack_client.send_alert(
        AlertTypeGrouped(
            alert_type=alert_type,
            alert_severity=alert_severity,
            detailed_info={"message": msg},
        )
    )


# NOTE(@lberg): Celery does not support async functions by default.
# This decorator run the async function in the worker thread's event loop.
# https://stackoverflow.com/questions/70960234/how-to-use-asyncio-and-aioredis-lock-inside-celery-tasks
def async_task(
    *,
    retry_exc_type: Type[Exception] = RetryError,
    alert_type_on_fail: AlertType = AlertType.TASK_FAILED,
    alert_severity_on_fail: AlertSeverity = AlertSeverity.INFO,
) -> Callable[..., Any]:
    def decorator(f: Callable[..., Any]) -> Callable[..., Any]:
        # NOTE(@lberg): this makes the task name the same as the function name
        @wraps(f)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            fun_name = f.__name__
            loop = asyncio.get_running_loop()
            start_time = time.time()

            def _instrument_task(success: bool) -> None:
                duration = time.time() - start_time
                envs = get_backend_envs()
                if not envs.disable_instrumentation_middleware:
                    try:
                        asyncio.run_coroutine_threadsafe(
                            instrument_celery_tasks(fun_name, duration, success), loop
                        ).result()
                    except Exception as e:
                        logger.error(
                            "Failed to send instrumentation metrics for task"
                            f" {fun_name}: {e}"
                        )

            try:
                res = asyncio.run_coroutine_threadsafe(
                    f(*args, **kwargs), loop
                ).result()
                _instrument_task(success=True)
                return res
            except Exception as e:
                if isinstance(e, retry_exc_type):
                    # NOTE(@lberg): this means the task is being retried
                    # so we don't want to send an alert or instrument it
                    raise e

                _instrument_task(success=False)
                try:
                    asyncio.run_coroutine_threadsafe(
                        _send_error_alert(
                            alert_type=alert_type_on_fail,
                            alert_severity=alert_severity_on_fail,
                            msg=f"{fun_name} failed with : {str(e)}",
                        ),
                        loop,
                    ).result()
                except Exception as alert_ex:
                    logger.error(
                        f"Failed to send slack alert for task {fun_name}: {alert_ex}"
                    )
                raise TaskExecutionError(f"{fun_name} failed with : {str(e)}")

        return wrapper

    return decorator


# Decorator to skip a task if the environment name is in the given list
def skip_task_if_env_match(env_names: list[str]) -> Callable[..., Any]:
    def decorator(f: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(f)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            env_name = get_backend_envs().environment_name
            if env_name in env_names:
                logger.info(f"Skipping task {f.__name__} because {env_name=}")
                return SKIPPED_TASK
            return f(*args, **kwargs)

        return wrapper

    return decorator


# Decorator to skip a task if a feature flag is disabled
def skip_task_if_feature_flag_disabled(
    feature_flag: models.FeatureFlags,
) -> Callable[..., Any]:
    def decorator(f: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(f)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            db = get_backend_database()
            loop = asyncio.get_running_loop()

            async def is_feature_enabled() -> bool:
                async with db.session() as session:
                    feature_enabled = (
                        await orm.Feature.system_is_default_feature_enabled(
                            session, feature_flag
                        )
                    )
                return feature_enabled

            feature_enabled = asyncio.run_coroutine_threadsafe(
                is_feature_enabled(), loop
            ).result()
            if not feature_enabled:
                logger.info(f"Skipping task {f.__name__}: {feature_flag} disabled")
                return SKIPPED_TASK
            return f(*args, **kwargs)

        return wrapper

    return decorator
