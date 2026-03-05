"""
ForensicsMainHand 2.0 - Web Analyzer API Routes
"""
from flask import Blueprint, request, jsonify
from .tools import (
    get_headers, resolve_domain, whois_lookup,
    detect_xss, port_scan, check_security_headers,
    discover_login_pages, brute_force_login
)

web_bp = Blueprint('web', __name__)


@web_bp.route('/headers', methods=['POST'])
def headers():
    data = request.get_json()
    url = data.get('url', '')
    return jsonify(get_headers(url))


@web_bp.route('/resolve', methods=['POST'])
def resolve():
    data = request.get_json()
    domain = data.get('domain', '')
    return jsonify(resolve_domain(domain))


@web_bp.route('/whois', methods=['POST'])
def whois_route():
    data = request.get_json()
    domain = data.get('domain', '')
    return jsonify(whois_lookup(domain))


@web_bp.route('/xss', methods=['POST'])
def xss():
    data = request.get_json()
    url = data.get('url', '')
    param = data.get('param', 'q')
    return jsonify(detect_xss(url, param))


@web_bp.route('/ports', methods=['POST'])
def ports():
    data = request.get_json()
    domain = data.get('domain', '')
    custom_ports = data.get('ports', None)
    return jsonify(port_scan(domain, custom_ports))


@web_bp.route('/security-headers', methods=['POST'])
def security_headers():
    data = request.get_json()
    url = data.get('url', '')
    return jsonify(check_security_headers(url))


@web_bp.route('/discover-login', methods=['POST'])
def discover_login():
    data = request.get_json()
    base_url = data.get('base_url', '')
    return jsonify(discover_login_pages(base_url))


@web_bp.route('/brute-force', methods=['POST'])
def brute_force():
    data = request.get_json()
    login_url = data.get('login_url', '')
    username_field = data.get('username_field', 'username')
    password_field = data.get('password_field', 'password')
    usernames = data.get('usernames', [])
    passwords = data.get('passwords', [])
    return jsonify(brute_force_login(login_url, username_field, password_field, usernames, passwords))
