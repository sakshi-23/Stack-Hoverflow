from flask import Blueprint,  render_template

from app import db

mod_data = Blueprint('view', __name__, url_prefix='/data')

@mod_data.route("/visualize")
def visualize():
    return render_template('viz.html')