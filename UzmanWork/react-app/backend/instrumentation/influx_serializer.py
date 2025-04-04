import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class InfluxSerializerError(Exception):
    pass


class EmptyTagKeyError(InfluxSerializerError):
    pass


class EmptyFieldKeyError(InfluxSerializerError):
    pass


class EmptyMeasurementStringError(InfluxSerializerError):
    pass


class EmptyFieldsStringError(InfluxSerializerError):
    pass


def _sanitize_string(to_sanitize: str) -> str:
    """Sanitize a string for influDB according to
    https://docs.influxdata.com/influxdb/v1.8/write_protocols/line_protocol_reference/

    :param to_sanitize: String to sanitize
    :return: Sanitized string
    """
    sanitized = ""
    for c in to_sanitize:
        if c == " " or c == "," or c == "=" or c == "\\" or c == '"':
            sanitized += "\\"
        sanitized += c
    return sanitized


# Serializer for InfluxDB, format description available at:
# https://docs.influxdata.com/influxdb/v1.7/write_protocols/line_protocol_reference/
class InfluxSerializer:
    # Build a serializer with the given measure
    def __init__(self, measurement_name: str):
        """The measurement name is the name of the measurement we'll set for all
        InfluxDB rows we publish.
        """
        self._measurement_string = _sanitize_string(measurement_name)
        self._tags_string = ""
        self._fields_string = ""
        self._timestamp = ""

    # add an influxDB tag
    def add_tag(self, key: str, val: str) -> None:
        """Adds an InfluxDB tag which can be used to filter the rows.
        A tag is a key-value pair, e.g. "nvr"-"nvr-snake".
        The key must be non null and unique between tags of this measurement.
        """
        if len(key) == 0:
            raise EmptyTagKeyError("[Influx Serialization] empty tag key")
        if len(val) == 0:
            logger.error(
                "[Influx Serialization] Empty tag value! Replacing with '<MISSING>'."
            )
            val = "<MISSING>"

        if len(self._tags_string) > 0:
            self._tags_string += ","

        self._tags_string += _sanitize_string(key) + "=" + _sanitize_string(val)

    # add an influxDB field
    def add_field(self, key: str, val: str | int | float) -> None:
        """Adds an InfluxDB field which can be used to visualize data.
        A field is a measurement of a value, e.g. "temperature" or "humidity".
        It has a key and a value. The value can be a string or a number.
        The key must be non null and unique between fields of this measurement.
        """
        if len(key) == 0:
            raise EmptyFieldKeyError("[Influx Serialization] empty field key")
        if isinstance(val, str) and len(val) == 0:
            logger.error(
                "[Influx Serialization] Empty field value! Replacing with '<MISSING>'."
            )
            val = "<MISSING>"

        if len(self._fields_string) > 0:
            self._fields_string += ","

        self._fields_string += _sanitize_string(key) + "="
        if isinstance(val, str):
            # For influxDB fields must use quotes if they are strings
            self._fields_string += '"' + _sanitize_string(val) + '"'
        else:
            self._fields_string += str(val)

    def set_timestamp(self, timestamp_ns: str) -> None:
        """Set the timestamp for the published InfluxDB row."""
        self._timestamp = timestamp_ns

    def get_as_string(self) -> str:
        """Generate the InfluxDB row as string. This should be called after we
        added all fields, tags and timestamp.
        """
        if not self._measurement_string:
            raise EmptyMeasurementStringError(
                "[Influx Serialization] empty measurement_string"
            )
        if not self._fields_string:
            raise EmptyFieldsStringError("[Influx Serialization] empty fields_string")

        s = self._measurement_string
        if self._tags_string:
            s += "," + self._tags_string
        s += " " + self._fields_string
        if self._timestamp:
            s += " " + self._timestamp

        return s
