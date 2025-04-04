# Testing

We use [pytest](https://docs.pytest.org/en/7.3.x/) for writing python tests. It is sometimes a bit magical, so there's a few things to be aware of when writing tests.

## Fixtures
Pytest has a concept of [fixures](https://docs.pytest.org/en/6.2.x/fixture.html) which is quite powerful but also somewhat confusing initially. Fixtures are the stuff which happens before a test and they can depend on each other.

The important thing to note here is that they are global and you don't need to import them.

They are declared as parameters to the test function and usually defined in a `conftest.py` file.

One can call any fixture in any parent conftest file. Fixtures from parent conftest files can also be redefined in children conftest files to adjust some behaviour.


## Writing tests
Ideally most of the setup of the test would happen in the fixtures and the test itself will only invoke the actual bit it is meant to test and then assert on the result.

The tests should generally be quite readable - assume that whoever is reading it has likely made a change which breaks it and had no idea about its existence before.

A test should generally do one setup and then assert on one state - they shouldn't repeatedly change the state and assert on the changes. These should be separate tests instead.

Avoid implicitly depending on hard-coded strings. Instead of hard-coding the same string in two places use a fixture or some attribute of a fixture.

#### Naming
For naming tests it usually pays off to err on the side of quite long and descriptive names - whenever it fails for someone else, it should be obvious from the name of the test what exactly is the test scenario.

Fixtures should be called after what they return and not after what they do - unlike all other functions.

#### Parametrize
In that spirit, use the `parametrize` functionality VERY sparingly - it makes tests quite hard to parse. This applies even more for parametrizing fixtures. If you ever need to do that, then you probably want a factory fixture instead.


## Mocking
Python has a built-in [library](https://docs.python.org/3/library/unittest.mock.html) for mocking. This should again be used sparingly for mocking out any parts of the system which shouldn't or can't be run in a test.

# Our Tests

## Running tests
`./run_backend_tests.sh` should run python tests for you.

This also supports appending all pytest arguments. Here are a few useful ones:

`./run_backend_tests.sh -x` - this will stop when a test fails.

`./run_backend_tests.sh -k access_test` - this will only run tests which have `access_test` in their name or in their path.


## Database access
We set up a real database for most of our tests. This is accessible under the fixture `db_instance`.

## Database object fixtures

The root `conftest` contains some fixtures for common database functions. There's three types:

1. Objects: `organization`, `nvr`, `camera`... - these just give you an object of that type to use in your test. They are all related to each other - the `nvr` fixture belongs to the `organization` fixture and so on. These are to be used when you don't care about what type of nvr, camera, etc. you get in the test.
2. Default factory functions: `create_location_default`, `create_camera_default`... - these give you a function which just creates an object of that type and uses the object fixtures as its base. This means that a camera created by `create_camera_default` is in the `camera_group` group and belongs to the `nvr` nvr. These are to be used when you want multiple objects of that type and don't care about their parent objects in your test.
3. Factory functions: `create_camera`, `create_organization` etc. These are the most flexible fixtures - they allow you to specify the parent objects for the object they create along with all of their properties. Note that they still allow you to not specify names, etc. and will autogenerate one for you. These are to be used when the other ones don't work for you.

