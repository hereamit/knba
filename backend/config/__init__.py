import os

if os.getenv("DJANGO_DB_ENGINE", "sqlite").lower() == "mysql":
    import pymysql

    pymysql.version_info = (2, 2, 1, "final", 0)
    pymysql.install_as_MySQLdb()
