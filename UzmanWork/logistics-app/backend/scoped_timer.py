import time
from types import TracebackType
from typing import Optional, Type


class Timer:
    """Timer class to measure the duration of a code block.

    Example usage:
      with Timer() as timer:
        time.sleep(2)

      print(timer.duration())
    """

    def __enter__(self) -> "Timer":
        """Enter callback"""
        self._start_time = time.time()
        return self

    async def __aenter__(self) -> "Timer":
        """Enter callback"""
        return self.__enter__()

    def __exit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType],
    ) -> None:
        """Exit callback"""
        self._end_time = time.time()
        self._duration = self._end_time - self._start_time

    async def __aexit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType],
    ) -> None:
        """Exit callback"""
        return self.__exit__(exc_type, exc_val, exc_tb)

    def duration(self) -> float:
        """Get the measured duration in seconds.

        :return: measured duration in seconds
        """
        return self._duration
