import pytest

from backend.instrumentation.influx_serializer import (
    EmptyFieldKeyError,
    EmptyFieldsStringError,
    EmptyMeasurementStringError,
    EmptyTagKeyError,
    InfluxSerializer,
)


def test_wrong_inputs() -> None:
    ser = InfluxSerializer("")

    with pytest.raises(EmptyMeasurementStringError):
        ser.get_as_string()

    ser = InfluxSerializer("dummy_measurement_no_fields")
    with pytest.raises(EmptyFieldsStringError):
        ser.get_as_string()

    with pytest.raises(EmptyTagKeyError):
        ser.add_tag("", "dummy_value")

    with pytest.raises(EmptyFieldKeyError):
        ser.add_field("", "dummy_value")

    ser = InfluxSerializer("dummy_measurement_empty_key")
    ser.add_field("dummy_key", "")
    assert "<MISSING>" in ser.get_as_string()

    ser = InfluxSerializer("dummy_measurement_empty_tag")
    ser.add_tag("dummy_key", "dummy_value")
    ser.add_field("dummy_key", "")
    assert "<MISSING>" in ser.get_as_string()


def test_serialization_string() -> None:
    ser = InfluxSerializer("test_measurement")
    ser.add_tag("test_tag_key", "test_tag_value")
    ser.add_field("test_field_key", "test_field_value")
    assert (
        ser.get_as_string() == "test_measurement,test_tag_key=test_tag_value"
        ' test_field_key="test_field_value"'
    )


def test_serialization_numeric() -> None:
    ser = InfluxSerializer("test_measurement")
    ser.add_tag("test_tag_key", "test_tag_value")
    ser.add_field("int_field_key", 100)
    ser.add_field("float_field_key", 3.14)
    assert (
        ser.get_as_string() == "test_measurement,test_tag_key=test_tag_value"
        " int_field_key=100,float_field_key=3.14"
    )


def test_serialization_timestamp() -> None:
    ser = InfluxSerializer("test_measurement")
    ser.add_tag("test_tag_key", "test_tag_value")
    ser.add_field("test_field_key", "test_field_value")
    ser.set_timestamp("100")
    assert (
        ser.get_as_string() == "test_measurement,test_tag_key=test_tag_value"
        ' test_field_key="test_field_value" 100'
    )
