# Migrate SQLite file to Amazon RDS Postgres database
import psycopg2
import sqlite3

conn1 = sqlite3.connect("so.db")
cur1 = conn1.cursor()


# DO NOT SHARE the following collection information with others
# Cost is based on usage, so please do not run crazy queries (e.g., return all 9M posts using SELECT * FROM posts)
host = "cs7450.c1zllqztfunw.us-east-1.rds.amazonaws.com"
conn = psycopg2.connect(host=host, port="5432", database="minsuk", user="cs7450", password="cs7450!proj")
cur = conn.cursor()

def create():
	q = """
		CREATE TABLE posts (
			post_id int primary key, 
			user_id int, 
			create_date date,
			score smallint,
			answer_count smallint,
			view_count int,
			title text
		)
	"""
	cur.execute(q)
	q = """
		CREATE TABLE post_tags (
			post_id int,
			tag varchar(30),
			primary key (post_id, tag)
		)
	"""
	cur.execute(q)
	q = """
		CREATE TABLE users (
			user_id int primary key,
			register_date date,
			reputation int,
			age int null,
			location varchar(120) null
		)
	"""
	cur.execute(q)
	conn.commit()



def insert1():
	q_insert = "INSERT INTO posts VALUES (%s, %s, %s, %s, %s, %s, %s);"
	q = "SELECT * FROM posts ORDER BY post_id LIMIT -1 OFFSET 0"
	cur1.execute(q)
	unit = 100000
	rows = 1
	i = 0
	while rows:
		print i*unit
		i += 1
		rows = cur1.fetchmany(unit)
		cur.executemany(q_insert, rows)
		conn.commit()

def insert2():
	q_insert = "INSERT INTO post_tags VALUES (%s, %s);"
	q = "SELECT * FROM post_tags ORDER BY post_id, tag LIMIT -1 OFFSET 0"
	cur1.execute(q)
	unit = 250000
	rows = 1
	i = 0
	while rows:
		print i*unit
		i += 1
		rows = cur1.fetchmany(unit)
		cur.executemany(q_insert, rows)
		conn.commit()

def insert3():
	q_insert = "INSERT INTO users VALUES (%s, %s, %s, %s, %s);"
	q = """SELECT user_id, register_date, reputation, age, location 
		FROM users 
		WHERE user_id IN (SELECT user_id FROM posts)
		ORDER BY user_id LIMIT -1 OFFSET 0
	"""
	cur1.execute(q)
	unit = 100000
	rows = 1
	i = 0
	while rows:
		print i*unit
		i += 1
		rows = cur1.fetchmany(unit)
		cur.executemany(q_insert, rows)
		conn.commit()
		

def create_index():
	q = "CREATE INDEX post_tags_index_tag_post ON post_tags (tag, post_id);"
	cur.execute(q)
	conn.commit()
	q = "CREATE INDEX post_index_date ON posts (create_date);"
	cur.execute(q)
	conn.commit()

#create()
#insert1()
#insert2()
#insert3()
#create_index()

