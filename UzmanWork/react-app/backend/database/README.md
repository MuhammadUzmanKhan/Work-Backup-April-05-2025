# Database and ORM usage

## Multi-tenancy

The database is multi-tenant, meaning that it can be used by multiple organisations.
To implement security controls and prevent data leaks between different tenants we use Postgres role-level access
control (RLS).
More information on RLS here https://www.postgresql.org/docs/current/ddl-rowsecurity.html.
All multi-tenant tables must have a tenant "column" and an associated tenant "policy".

## Creating SqlAlchemy models

All tenant-aware models must inherit from `TenantProtectedTable`, check [orm_utils.py](orm%2Form_utils.py).
You also need to add a foreign key constraint to the tenant column in Organisations table, check the example below.

```python
import sqlalchemy as sa
from backend.database.orm.orm_utils import TenantProtectedTable


class Model(TenantProtectedTable):
    __table_args__ = ((sa.ForeignKeyConstraint(["tenant"], ["organizations.tenant"])),)
```

## Multi-tenant database schemas and RLS policies

Example of RLS policy creation with Alembic:

```python
from alembic import op


def upgrade() -> None:
    op.execute("ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;")
    op.execute("""
        CREATE POLICY tenant_isolation on table_name
        USING (tenant = current_setting('app.tenant'));
        """)


def downgrade() -> None:
    op.execute("ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;")
    op.execute("DROP POLICY tenant_isolation on table_name;")
```

Usually tenant column will be generated automatically with Alembic migration. Bellow is an example of how it should look
like in your migration file.

```python
from alembic import op
import sqlalchemy as sa

op.create_table(
    "table_name",
    sa.Column("tenant", sa.String(), nullable=False)
)
```

## Using different type of SqlAlchemy Sessions

### Tenant-scoped session

* Tenant-scoped session are bound to a tenant. They are used to access tenant-scoped data. All joins in tenant-scoped
  session will always return data from the same tenant.
* They are defined in [session.py](session.py).
* Tenant-scoped sessions are created using `db.tenant_session()`. Tenant can be passed as an argument, or it if not
  passed, it will be taken from the current context.
  Check [auth_context.py](..%2Fauth_context.py) and [auth.py](..%2Fauth.py)

```python
async with db.tenant_session() as session:
    pass

async with db.tenant_session(tenant="manually set tenant") as session:
    pass
```

### System-scoped session

* System-scoped session are not bound to any tenant. Please use them only when you need to access data for all tenants
  in
  one transaction.
* System-scoped sessions are created using `db.session()`.

```python
async with db.session() as session:
    pass
```

### ORM naming convention

If you create an ORM method that requires a system-scoped session please prepened it with `system_`. This is just a
convention to highlight dangerous multi-tenant queries.

```python
async with db.session() as session:
    await orm.Model.system_get_models(
        session, ...
    )
```
