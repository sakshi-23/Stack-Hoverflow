from xml.dom.minidom import parse, parseString
import sqlite3

conn = sqlite3.connect("so.db")
cur = conn.cursor()

def create():
	q = """
		CREATE TABLE posts (
			post_id int primary key, 
			user_id int, 
			create_date datetime,
			score int,
			answer_count int,
			view_count int,
			title text
		)
	"""
	cur.execute(q)
	q = """
		CREATE TABLE post_tags (
			post_id int,
			tag text,
			primary key (post_id, tag)
		)
	"""
	cur.execute(q)
	q = """
		CREATE TABLE users (
			user_id int primary key,
			register_date datetine,
			reputation int,
			up_votes int,
			down_votes int,
			age int null,
			location text null
		)
	"""
	cur.execute(q)



def insert():

	#w1 = open("tsv_posts.tsv", "w")
	#w2 = open("tsv_posttags.tsv", "w")
	q1 = "INSERT INTO posts VALUES (?, ?, ?, ?, ?, ?, ?);"
	q2 = "INSERT INTO post_tags VALUES (?, ?);"
	posts = []
	posttags = []
	with open("Posts.xml") as f:
		i = -2
		for l in f:
			i += 1
			if i >= 1 and i <= 26545724:
				#print l[:-1]
				dom = parseString(l[:-1])
				r = dom.getElementsByTagName("row")[0]
				if r.getAttribute("PostTypeId") == "1" and r.hasAttribute("Tags") and r.hasAttribute("OwnerUserId"):
					r_id = int(r.getAttribute("Id"))
					#t = map( r.getAttribute, attributes )
					p = (r_id, int(r.getAttribute("OwnerUserId")), r.getAttribute("CreationDate"), int(r.getAttribute("Score")), int(r.getAttribute("AnswerCount")), int(r.getAttribute("ViewCount")), r.getAttribute("Title"))
					#print p
					tags_text = r.getAttribute("Tags")
					tags = tags_text[1:-1].split("><")
					#print i
					#print tags
					tags_set = set()
					for t in tags:
						#print t
						if t not in tags_set:
							tags_set.add(t)
							posttags.append( (r_id, t) )
					posts.append( p )
					

			if i % 1000000 == 0:
				print i
			if i % 1000000 == 0:
				print len(posts)
				print len(posttags)
				cur.executemany(q1, posts)
				cur.executemany(q2, posttags)
				conn.commit()
				posts = []
				posttags = []
			#if i == 501000:
			#	break
		cur.executemany(q1, posts)
		cur.executemany(q2, posttags)
		conn.commit()
		print i

	#w1.close()
	#w2.close()

def insert_users():

	q1 = "INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?);"
	users = []
	with open("Users.xml") as f:
		i = -2
		for l in f:
			i += 1
			if i >= 1 and i <= 4551129:
				#print l[:-1]
				dom = parseString(l[:-1])
				r = dom.getElementsByTagName("row")[0]
				r_id = int(r.getAttribute("Id"))
				age = int(r.getAttribute("Age")) if r.hasAttribute("Age") else None
				location = r.getAttribute("Location") if r.hasAttribute("Location") else None

				p = (r_id, r.getAttribute("CreationDate"), int(r.getAttribute("Reputation")), int(r.getAttribute("UpVotes")), int(r.getAttribute("DownVotes")), age, location)
				users.append( p )
					

			if i % 1000000 == 0:
				print i
		cur.executemany(q1, users)
		conn.commit()
		print i

def create_index():
	#q = "CREATE INDEX post_tag ON post_tags (post_id, tag);"
	#cur.execute(q)
	q = "CREATE INDEX post_tags_index_tag_post ON post_tags (tag, post_id);"
	cur.execute(q)

create()
insert()
insert_users()
create_index()