from backend.database.database import Database, DatabaseConnectionConfig
from backend.envs import BackendSecrets


def get_database() -> Database:
    secrets = BackendSecrets()
    connection_config = DatabaseConnectionConfig(
        user=secrets.postgres_user,
        password=secrets.postgres_pwd,
        database=secrets.postgres_db,
        host=secrets.postgres_host,
        port=secrets.postgres_port,
    )
    return Database(connection_config, application_name="scripts")
