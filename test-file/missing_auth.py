from flask import Flask
app = Flask(__name__)

from flask import request, abort

def login_required(f):
    def decorated_function(*args, **kwargs):
        auth = request.authorization
        if not auth or not (auth.username == 'admin' and auth.password == 'secret'):
            abort(401)
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@app.route("/admin")
@login_required
def admin_panel():
    return "Sensitive admin panel exposed"
