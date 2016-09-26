from flask import Blueprint,  render_template,request
from app import db
import json
from collections import defaultdict

mod_data = Blueprint('data', __name__, url_prefix='/data')

class Content(db.Model):
    db.Model.metadata.reflect(db.engine)
    __table__ = db.Model.metadata.tables['posts']

    nodes = []

    def __repr__(self):
        return self.post_id

@mod_data.route('/get-info')
def get_info():
   first=Content.query.with_entities(Content.title).limit(5).all()
   print first
   return json.dumps(first)


@mod_data.route('/line/<given_tag>')
def get_line_chart(given_tag):
        # dirty to change later
    tags =given_tag.split(",")
    output = {"lines": [],"related":[],"tags":tags}
        
    for tag in tags:
        q = """
            SELECT date_trunc('month', p.create_date) as bin, count(*) as count 
            FROM post_tags_sampled t LEFT OUTER JOIN posts_sampled p ON t.post_id = p.post_id
            WHERE t.tag = :given_tag
            GROUP BY date_trunc('month', p.create_date)
            ORDER BY date_trunc('month', p.create_date)
        """
        result = db.session.execute(q, {"given_tag": tag})
        temp={"name":tag,"Data":[]}
        for r in result:
            temp["Data"].append( {"Date": r[0].strftime("%Y-%m"), "Value": r[1]} )
        temp["Data"].pop()
        output["lines"].append(temp)
        result.close()
     
    for tag in tags:
        q2 = """
            SELECT date_trunc('month', create_date) as bin, p.post_id, title, create_date, score, user_id, tags, tag, count, rank
            FROM related_tags_with_first_post_materialized r
            LEFT OUTER JOIN posts_sampled p ON r.post_id = p.post_id
            WHERE source_tag = :given_tag
            AND rank <= :number_of_related
        """
        result2 = db.session.execute(q2, {"given_tag": tag, "number_of_related": 10})
        temp={"name":tag,"Data":[]}
        for r in result2:
            temp["Data"].append( {"tag": r[7], "count": r[8], "post_id": r[1], "create_date": r[3].strftime("%Y-%m"), "score": r[4], "user_id": r[5], "tags": r[6]} )
        result2.close()
        output["related"].append(temp)
    return json.dumps(output)

@mod_data.route('/line2/<two_tags>')
def get_line_chart_tagpair(two_tags):
    d = []
    output=[]
    q = """
        SELECT date_trunc('month', p.create_date) as bin, count(*) as count 
        FROM (SELECT post_id, string_agg(tag, ',' ORDER BY tag)
            FROM post_tags_sampled
            GROUP BY post_id) t LEFT OUTER JOIN posts_sampled p ON t.post_id = p.post_id
        WHERE t.string_agg LIKE :tag1 AND t.string_agg LIKE :tag2
        GROUP BY date_trunc('month', p.create_date)
        ORDER BY date_trunc('month', p.create_date)
    """
    tagsAll = ["javascript", "java", "php", "python", "html", "c++", "css", ".net", "c", "ruby"]
    
    for tag in tagsAll:
        d = []
        result = db.session.execute(q, {"tag1":"%"+tag+"%","tag2":"%"+two_tags+"%"})
        for r in result:
            d.append( {"bin": r[0].strftime("%Y-%m"), "count": r[1]} )
        output.append({"name":tag, "results": d})
    return json.dumps(output)

@mod_data.route('/related_with_first/<given_tag>')
def get_related_with_first(given_tag):
    d = []
    qx = """
        SELECT tag, count, rank, p.post_id, p.create_date, p.title
        FROM (
            SELECT z.tag, z.count, z.rank, b.post_id,
                row_number() over (partition by z.tag order by b.post_id asc) as no
            FROM (
                SELECT y.tag, count(*) as count, 
                    row_number() over (order by count(*) desc) as rank
                FROM post_tags_sampled x JOIN post_tags_sampled y 
                ON x.post_id = y.post_id AND x.tag != y.tag
                WHERE x.tag = :given_tag
                GROUP BY y.tag
            ) z
            JOIN post_tags_sampled b ON z.tag = b.tag
            WHERE rank <= :number_of_related
        ) w
        LEFT OUTER JOIN posts_sampled p ON w.post_id = p.post_id
        WHERE no <= 1
        ORDER BY rank
    """
    q = """
        SELECT tag, count, rank, p.post_id, p.create_date, p.title
        FROM related_tags_with_first_post_materialized r
        LEFT OUTER JOIN posts_sampled p ON r.post_id = p.post_id
        WHERE source_tag = :given_tag
        AND rank <= :number_of_related
    """
    result = db.session.execute(q, {"given_tag": given_tag, "number_of_related": 10})
    for r in result:
        print r
        d.append( {"tag": r[0], "count": r[1], "post_id": r[3], "post_title": r[5], "post_create_date": r[4].strftime("%Y-%m-%d")} )
    output = {"results": d}
    return json.dumps(output)

@mod_data.route('/add_related_to_graph/<given_tag>')
def get_related_nodes_for_graph(given_tag):

    print Content.nodes


    d = {"nodes": [], "links": []}
    if "," not in given_tag:
        Content.nodes.append(given_tag)
        q = "SELECT count(*) FROM post_tags_sampled WHERE tag = :given_tag "
        result = db.session.execute(q, {"given_tag": given_tag})
        co = 100
        for r in result:
            co = r[0]
            d["nodes"].append( {"label": given_tag, "count": co} )
            break
        q = """
            SELECT tag, count
            FROM related_tags_with_first_post_materialized
            WHERE source_tag = :given_tag
            AND (rank <= :number_of_related * 0.5 OR (rank <= :number_of_related AND count > :co*0.05))
        """
        result = db.session.execute(q, {"given_tag": given_tag, "number_of_related": 10, "co": co})
        r_nodes = []
        for r in result:
            d["nodes"].append( {"label": r[0], "count": r[1]} )
            d["links"].append( {"source_label": given_tag, "target_label": r[0]} )
            r_nodes.append(r[0])
            if r[0] not in Content.nodes:
                Content.nodes.append(r[0])
        
        # egonet (find connection among related tags)
        q = """
            SELECT source_tag, tag, count
            FROM related_tags_with_first_post_materialized
            WHERE source_tag IN ("""+ ', '.join(["'"+v+"'" for v in Content.nodes]) +""")
            AND tag IN ("""+ ', '.join(["'"+v+"'" for v in Content.nodes]) +""")
            AND rank <= :number_of_related
            AND count > 20
        """
        result = db.session.execute(q, {"given_tag": given_tag, "number_of_related": 10})
        for r in result:
            d["links"].append( {"source_label": r[0], "target_label": r[1]} )

    else:
        q = "SELECT count(*) FROM posts_sampled WHERE tags @> array["+ ','.join(['\''+t+'\'' for t in given_tag.split(',')]) +"]::varchar[] "
        result = db.session.execute(q, {"given_tag": given_tag})
        co = 100
        for r in result:
            co = r[0]
            break
        q = """
            SELECT tag, count(*) as count
            FROM post_tags_sampled t 
            WHERE tag NOT IN ("""+ ','.join(["'"+t+"'" for t in given_tag.split(",")]) +""") AND post_id IN (
                SELECT post_id
                FROM posts_sampled
                WHERE tags @> array["""+ ','.join(["'"+t+"'" for t in given_tag.split(",")]) +"""]::varchar[]
                ORDER BY score desc
                LIMIT 2000
            )
            GROUP BY tag
            ORDER BY count(*) desc
            LIMIT 5
        """
        result = db.session.execute(q)
        r_nodes = []
        for r in result:
            d["nodes"].append( {"label": r[0], "count": r[1]} )
            for t in given_tag.split(","):
                d["nodes"].append( {"label": t, "count": co} )
                d["links"].append( {"source_label": t, "target_label": r[0]} )
            r_nodes.append(r[0])
            if r[0] not in Content.nodes:
                Content.nodes.append(r[0])
        
    #print d   
    output = {"results": d}
    return json.dumps(output)

@mod_data.route('/flux/<given_tag>')
def get_flux(given_tag):
    output = {"results": {"dots": [], "related": [], "given": given_tag}}

    d = defaultdict(list)
    q = """
        SELECT date_trunc('month', create_date) as bin, post_id, title, create_date, score, user_id, tags
        FROM posts_sampled
        WHERE tags @> array[:given_tag]::varchar[]
        ORDER BY score desc
        LIMIT 500
    """
    result = db.session.execute(q, {"given_tag": given_tag})
    post_id_list = []
    for r in result:
        d[r[0].strftime("%Y-%m")].append( {"post_id": r[1], "title": r[2], "create_date": r[3].strftime("%Y-%m-%d"), "score": r[4], "user_id": r[5], "tags": r[6]} )
        post_id_list.append(r[1])
    result.close()

    q2 = """
        SELECT date_trunc('month', create_date) as bin, p.post_id, title, create_date, score, user_id, tags, tag, count, rank
        FROM related_tags_with_first_post_materialized r
        LEFT OUTER JOIN posts_sampled p ON r.post_id = p.post_id
        WHERE source_tag = :given_tag
        AND rank <= :number_of_related
    """
    result2 = db.session.execute(q2, {"given_tag": given_tag, "number_of_related": 10})
    for r in result2:
        if r[1] not in post_id_list:
            post_id_list.append(r[3])
            d[r[0].strftime("%Y-%m")].append( {"post_id": r[1], "title": r[2], "create_date": r[3].strftime("%Y-%m-%d"), "score": r[4], "user_id": r[5], "tags": r[6]} )
        output["results"]["related"].append( {"tag": r[7], "count": r[8], "post_id": r[1], "title": r[2], "create_date": r[3].strftime("%Y-%m-%d"), "score": r[4], "user_id": r[5], "tags": r[6]} )
    result2.close()

    bins = sorted(d.keys())
    output["results"]["dots"] = [{"bin": b, "posts": d[b]} for b in bins]
    return json.dumps(output)


@mod_data.route('/getTop30Related')
def get_top_related():
    output = {"results": []}
    tags = ["javascript", "java", "c#", "php", "python", "html", "c++", "css", "objective-c", ".net", "c", "ruby", "r", "matlab", "swift", "perl", "css3","smalltalk","actionscript"]
    for tag in tags:
        q2 = """
            SELECT date_trunc('month', create_date) as bin, p.post_id, title, create_date, score, user_id, tags, tag, count, rank
            FROM related_tags_with_first_post_materialized r
            LEFT OUTER JOIN posts_sampled p ON r.post_id = p.post_id
            WHERE source_tag = :given_tag
            AND rank <= :number_of_related
        """
        result2 = db.session.execute(q2, {"given_tag": tag, "number_of_related": 10})
        for r in result2:
            output["results"].append( {"tag": r[7], "count": r[8], "post_id": r[1], "title": r[2], "create_date": r[3].strftime("%Y-%m-%d"), "score": r[4], "user_id": r[5], "tags": r[6]} )
        result2.close()

    return json.dumps(output)

@mod_data.route('/flux_multiple/<given_tags>')
def get_flux_multiple(given_tags):
    # input should be separated by commas with no blank space
    output = {"results": {"dots": [], "related": []}}

    d = defaultdict(list)
    q = """
        SELECT date_trunc('month', create_date) as bin, post_id, title, create_date, score, user_id, tags
        FROM posts_sampled
        WHERE tags @> array["""+ ','.join(["'"+t+"'" for t in given_tags.split(",")]) +"""]::varchar[]
        ORDER BY score desc
        LIMIT 500
    """
    result = db.session.execute(q)
    for r in result:
        d[r[0].strftime("%Y-%m")].append( {"post_id": r[1], "title": r[2], "create_date": r[3].strftime("%Y-%m-%d"), "score": r[4], "user_id": r[5], "tags": r[6]} )
        
    result.close()

    q2 = """
        SELECT date_trunc('month', create_date) as bin, p.post_id, title, create_date, score, user_id, tags, tag, count
        FROM (
            SELECT z.tag, z.count, a.post_id,
                row_number() over (partition by z.tag order by a.post_id asc) as no
            FROM (
                SELECT tag, count(*) as count
                FROM post_tags_sampled t 
                WHERE tag NOT IN ("""+ ','.join(["'"+t+"'" for t in given_tags.split(",")]) +""") AND post_id IN (
                    SELECT post_id
                    FROM posts_sampled
                    WHERE tags @> array["""+ ','.join(["'"+t+"'" for t in given_tags.split(",")]) +"""]::varchar[]
                    ORDER BY score desc
                    LIMIT 2000
                )
                GROUP BY tag
                ORDER BY count(*) desc
                LIMIT 10
            ) z
            JOIN post_tags_sampled a ON z.tag = a.tag
        ) w
        LEFT OUTER JOIN posts_sampled p ON w.post_id = p.post_id
        WHERE no <= 1
        

    """
    result2 = db.session.execute(q2)
    for r in result2:
        output["results"]["related"].append( {"tag": r[7], "count": r[8], "post_id": r[1], "title": r[2], "create_date": r[3].strftime("%Y-%m-%d"), "score": r[4], "user_id": r[5], "tags": r[6]} )
    result2.close()

    


    bins = sorted(d.keys())
    output["results"]["dots"] = [{"bin": b, "posts": d[b]} for b in bins]
    return json.dumps(output)



@mod_data.route('/top30')
def get_top30():
    # dirty
    Content.nodes = []
    
    tags = ["javascript", "java",  "php", "python", "html", "c++", "css", ".net", "c", "ruby"]
    output = {"lines": [],"related":[],"tags":tags}
        
    for tag in tags:
        q = """
            SELECT date_trunc('month', p.create_date) as bin, count(*) as count 
            FROM post_tags_sampled t LEFT OUTER JOIN posts_sampled p ON t.post_id = p.post_id
            WHERE t.tag = :given_tag
            GROUP BY date_trunc('month', p.create_date)
            ORDER BY date_trunc('month', p.create_date)
        """
        result = db.session.execute(q, {"given_tag": tag})
        temp={"name":tag,"Data":[]}
        for r in result:
            temp["Data"].append( {"Date": r[0].strftime("%Y-%m"), "Value": r[1]} )
	temp["Data"].pop()
        output["lines"].append(temp)
        result.close()
     
    for tag in tags:
        q2 = """
            SELECT date_trunc('month', create_date) as bin, p.post_id, title, create_date, score, user_id, tags, tag, count, rank
            FROM related_tags_with_first_post_materialized r
            LEFT OUTER JOIN posts_sampled p ON r.post_id = p.post_id
            WHERE source_tag = :given_tag
            AND rank <= :number_of_related
        """
        result2 = db.session.execute(q2, {"given_tag": tag, "number_of_related": 10})
        temp={"name":tag,"Data":[]}
        for r in result2:
            temp["Data"].append( {"tag": r[7], "count": r[8], "post_id": r[1], "create_date": r[3].strftime("%Y-%m"), "score": r[4], "user_id": r[5], "tags": r[6]} )
        result2.close()
        output["related"].append(temp)
    return json.dumps(output)

@mod_data.route('/search_tags')
def search_tags():
    t = request.args.get('term')
    d = []
    q = """
        SELECT tag
        FROM post_tags_sampled
        WHERE tag LIKE '"""+t+"""%'
        GROUP BY tag
        HAVING count(*) > 10
        ORDER BY count(*) desc
        LIMIT 20
    """
    result = db.session.execute(q)
    for r in result:
        d.append( r[0])
    #output = {"results": d}
    return json.dumps(d)


