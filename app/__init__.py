import os
import sys

from flask import Flask, render_template, redirect, url_for
from flask.ext.sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config.from_object('config')

db = SQLAlchemy(app)


@app.route("/")
def visualize():
    return render_template('index.html')
   
@app.errorhandler(404)
def not_found(error):
    return "TODO: 404 page", 404
   
   
from app.data.views import mod_data as viewModule
from app.data.models import mod_data as dataModule
app.register_blueprint(viewModule)
app.register_blueprint(dataModule)
