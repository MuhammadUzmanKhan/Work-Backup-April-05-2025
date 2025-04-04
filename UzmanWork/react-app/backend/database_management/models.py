import pydantic


class PartmanDefaultTableInfo(pydantic.BaseModel):
    table_name: str
    rows_count: int
