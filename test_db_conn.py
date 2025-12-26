import psycopg2
try:
    conn = psycopg2.connect(
        host="localhost",
        port=5433,
        database="kong",
        user="kong",
        password=""
    )
    print("Connection successful!")
    conn.close()
except Exception as e:
    print(f"Connection failed: {e}")
