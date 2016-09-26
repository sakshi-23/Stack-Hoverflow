import psycopg2

# DO NOT SHARE the following collection information with others
# Cost is based on usage, so please do not run crazy queries (e.g., return all 9M posts using SELECT * FROM posts)
host = "cs7450.c1zllqztfunw.us-east-1.rds.amazonaws.com"
conn = psycopg2.connect(host=host, port="5432", database="minsuk", user="cs7450", password="cs7450!proj")
cur = conn.cursor()

def insert_languages():
	q_create = "CREATE TABLE languages (tag varchar(30) primary key, count int);"
	cur.execute(q_create)
	
	languages = ["JavaScript", "Java", "C#", "PHP", "Python", "C++", "Ruby", "CSS", "C", "Objective-C", "Perl", "Shell", "R", "Scala", "Haskell", "Matlab", "Go", "Visual Basic", ".net", "Clojure", "Groovy", "css3", "HTML", "Swift", "D", "Lisp", "Fortran", "Rust"]
	languages_str = ", ".join(["'"+l.lower().replace(" ", "-")+"'" for l in languages])
	q = "INSERT INTO languages (SELECT tag, count(*) FROM post_tags WHERE tag IN ("+ languages_str +") GROUP BY tag ORDER BY count(*) desc);"
	cur.execute(q)
	conn.commit()

def sampling():
	q = """
		CREATE TABLE posts_sampled (
			post_id int primary key, 
			user_id int, 
			create_date date,
			score smallint,
			answer_count smallint,
			view_count int,
			title text,
			tags varchar(30)[]
		)
	"""
	cur.execute(q)
	q = """
		CREATE TABLE post_tags_sampled (
			post_id int,
			tag varchar(30),
			primary key (post_id, tag)
		)
	"""
	cur.execute(q)

	q = """
		INSERT INTO posts_sampled
		SELECT p.post_id, user_id, create_date, score, answer_count, view_count, title, array_agg(t.tag)
		FROM posts p
		JOIN post_tags t ON p.post_id = t.post_id
		WHERE p.post_id % 20 = 0
		GROUP BY p.post_id
	"""
	cur.execute(q)

	q = """
		INSERT INTO post_tags_sampled
		SELECT post_id, tag
		FROM post_tags 
		WHERE post_id % 20 = 0
	"""
	cur.execute(q)

	# index
	q = "CREATE INDEX post_tags_sampled_index_tag_post ON post_tags_sampled (tag, post_id);"
	cur.execute(q)
	q = "CREATE INDEX post_sampled_index_date ON posts_sampled (create_date);"
	cur.execute(q)
	q = "CREATE INDEX post_sampled_index_tags ON posts_sampled (tags);"
	cur.execute(q)

	conn.commit()

def some_queries():
	# some queries. not decided whether to create views

	print "related tags"
	q = """
		SELECT source, tag, count
		FROM (
			SELECT x.tag as source, y.tag, count(*) as count, 
				row_number() over (partition by x.tag order by count(*) desc) as rank
			FROM post_tags_sampled x JOIN post_tags_sampled y ON x.post_id = y.post_id AND x.tag != y.tag
			WHERE x.tag IN ('java', 'css')
			GROUP BY x.tag, y.tag
		) z
		WHERE rank <= 5
		ORDER BY source, rank
	"""
	print q
	cur.execute(q)
	for r in cur.fetchall()[:10]:
		print r

	print "related tags with time when first co-ocurred"
	q = """
		SELECT source, tag, count, rank, p.post_id, p.create_date, p.title
		FROM (
			SELECT z.source, z.tag, z.count, z.rank, a.post_id,
				row_number() over (partition by z.source, z.tag order by a.post_id asc) as no
			FROM (
				SELECT x.tag as source, y.tag, count(*) as count, 
					row_number() over (partition by x.tag order by count(*) desc) as rank
				FROM post_tags_sampled x JOIN post_tags_sampled y ON x.post_id = y.post_id AND x.tag != y.tag
				WHERE x.tag IN ('ruby', 'scala')
				GROUP BY x.tag, y.tag
			) z
			JOIN post_tags_sampled a ON z.source = a.tag
			JOIN post_tags_sampled b ON z.tag = b.tag AND a.post_id = b.post_id
			WHERE rank <= 5
		) w
		LEFT OUTER JOIN posts_sampled p ON w.post_id = p.post_id
		WHERE no <= 1
		ORDER BY source, rank
	"""
	print q
	cur.execute(q)
	for r in cur.fetchall()[:10]:
		print r

	print "line graph"
	q = """
		SELECT t.tag, date_trunc('month', p.create_date) as bin, count(*) as count 
		FROM post_tags_sampled t LEFT OUTER JOIN posts_sampled p ON t.post_id = p.post_id
		WHERE t.tag IN ('objective-c', 'python')
		GROUP BY t.tag, date_trunc('month', p.create_date)
		ORDER BY t.tag, date_trunc('month', p.create_date)
	"""
	print q
	cur.execute(q)
	for r in cur.fetchall()[:10]:
		print r

	print "flux for single tag"
	q1 = """
		SELECT *, date_trunc('month', create_date) as bin
		FROM posts
		WHERE post_id IN (
			SELECT post_id 
			FROM post_tags
			WHERE tag = 'java'
		)
		ORDER BY score desc
		LIMIT 500
	"""
	q = """
		SELECT *, date_trunc('month', create_date) as bin
		FROM posts_sampled
		WHERE tags @> array['java']::varchar[]
		ORDER BY score desc
		LIMIT 500
	"""
	print q
	cur.execute(q)
	for r in cur.fetchall()[:10]:
		print r


def create_views():
	# related tags
	q = """
		CREATE VIEW related_tags AS
		SELECT source_tag, tag, count, rank
		FROM (
			SELECT x.tag as source_tag, y.tag, count(*) as count,
				row_number() over (partition by x.tag order by count(*) desc) as rank
			FROM post_tags_sampled x JOIN post_tags_sampled y ON x.post_id = y.post_id AND x.tag != y.tag
			GROUP BY x.tag, y.tag
		) z
		WHERE rank <= 10
		ORDER BY source_tag, rank
	"""
	cur.execute(q)
	
	# related tags with time when first co-ocurred
	q = """
		CREATE VIEW related_tags_with_first_post AS
		SELECT source_tag, tag, count, rank, p.post_id, p.create_date, p.title
		FROM (
			SELECT z.source_tag, z.tag, z.count, z.rank, a.post_id,
				row_number() over (partition by z.source_tag, z.tag order by a.post_id asc) as no
			FROM (
				SELECT x.tag as source_tag, y.tag, count(*) as count, 
					row_number() over (partition by x.tag order by count(*) desc) as rank
				FROM post_tags_sampled x JOIN post_tags_sampled y ON x.post_id = y.post_id AND x.tag != y.tag
				GROUP BY x.tag, y.tag
			) z
			JOIN post_tags_sampled a ON z.source_tag = a.tag
			JOIN post_tags_sampled b ON z.tag = b.tag AND a.post_id = b.post_id
			WHERE rank <= 10
		) w
		LEFT OUTER JOIN posts_sampled p ON w.post_id = p.post_id
		WHERE no <= 1
		ORDER BY source_tag, rank
	"""
	cur.execute(q)

	# line graph
	q = """
		CREATE VIEW tag_linechart_month AS
		SELECT t.tag, date_trunc('month', p.create_date) as bin, count(*) as count 
		FROM post_tags_sampled t LEFT OUTER JOIN posts_sampled p ON t.post_id = p.post_id
		GROUP BY t.tag, date_trunc('month', p.create_date)
		ORDER BY t.tag, date_trunc('month', p.create_date)
	"""
	cur.execute(q)
	
	conn.commit()
	

#insert_languages()
#sampling()
some_queries()
#create_views()