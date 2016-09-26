import os
_basedir = os.path.abspath(os.path.dirname(__file__))

DEBUG = False


#SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(_basedir, 'so.db')
SQLALCHEMY_DATABASE_URI = 'postgresql://cs7450:cs7450!proj@cs7450.c1zllqztfunw.us-east-1.rds.amazonaws.com/minsuk'

DATABASE_CONNECT_OPTIONS = {}

THREADS_PER_PAGE = 2

# Enable protection agains *Cross-site Request Forgery (CSRF)*
CSRF_ENABLED     = True

# Use a secure, unique and absolutely secret key for
# signing the data. 
CSRF_SESSION_KEY = "secret"

# Secret key for signing cookies
SECRET_KEY = "c39dcb77e31b57bb094e816c4982ac3c"