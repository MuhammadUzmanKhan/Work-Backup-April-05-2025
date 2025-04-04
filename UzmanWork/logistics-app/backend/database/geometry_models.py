from pydantic import BaseModel


# Generic 2D point
class Point2D(BaseModel):
    x: float
    y: float


# Generic 2D line
class Line2D(BaseModel):
    start_point: Point2D
    end_point: Point2D
