"""Serve the built frontend from Flask in production."""
import os
from flask import send_from_directory

def register_frontend(app):
    frontend_dir = os.environ.get('FMH_FRONTEND_DIR', None)
    if not frontend_dir or not os.path.isdir(frontend_dir):
        return

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        if path and os.path.exists(os.path.join(frontend_dir, path)):
            return send_from_directory(frontend_dir, path)
        return send_from_directory(frontend_dir, 'index.html')
