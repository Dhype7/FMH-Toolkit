"""
ForensicsMainHand 2.0 - Web Analyzer: Tools
Ported from original with enhancements.
"""
import requests
import socket
import urllib.parse
from typing import Dict, List, Any, Optional


def get_headers(url: str) -> Dict[str, Any]:
    """Fetch HTTP headers"""
    try:
        response = requests.get(url, timeout=10)
        return {
            "headers": dict(response.headers),
            "status_code": response.status_code,
            "url": response.url,
        }
    except Exception as e:
        return {"error": str(e)}


def resolve_domain(domain: str) -> Dict[str, Any]:
    """Advanced DNS resolution"""
    try:
        import dns.resolver
        import dns.exception

        if not domain:
            return {"error": "No domain provided"}
        parsed = urllib.parse.urlparse(domain)
        domain_only = parsed.netloc if parsed.netloc else parsed.path
        domain_only = domain_only.strip("/")
        if not domain_only:
            return {"error": "Invalid domain"}

        result = {"domain": domain_only}

        # A records
        try:
            a = dns.resolver.resolve(domain_only, 'A')
            result["ipv4"] = [r.to_text() for r in a]
        except Exception:
            result["ipv4"] = []

        # AAAA records
        try:
            aaaa = dns.resolver.resolve(domain_only, 'AAAA')
            result["ipv6"] = [r.to_text() for r in aaaa]
        except Exception:
            result["ipv6"] = []

        # CNAME
        try:
            cname = dns.resolver.resolve(domain_only, 'CNAME')
            result["cname"] = [str(r) for r in cname]
        except Exception:
            result["cname"] = []

        # MX
        try:
            mx = dns.resolver.resolve(domain_only, 'MX')
            result["mx"] = [str(r) for r in mx]
        except Exception:
            result["mx"] = []

        # TXT
        try:
            txt = dns.resolver.resolve(domain_only, 'TXT')
            result["txt"] = [str(r) for r in txt]
        except Exception:
            result["txt"] = []

        # NS
        try:
            ns = dns.resolver.resolve(domain_only, 'NS')
            result["ns"] = [str(r) for r in ns]
        except Exception:
            result["ns"] = []

        return result
    except Exception as e:
        return {"error": str(e)}


def whois_lookup(domain: str) -> Dict[str, Any]:
    """WHOIS lookup"""
    try:
        import whois
        if not domain:
            return {"error": "No domain provided"}
        parsed = urllib.parse.urlparse(domain)
        domain_only = parsed.netloc if parsed.netloc else parsed.path
        domain_only = domain_only.strip("/")

        original_timeout = socket.getdefaulttimeout()
        socket.setdefaulttimeout(10)
        try:
            info = whois.whois(domain_only)
            result = {}
            for key in ['domain_name', 'registrar', 'creation_date', 'expiration_date',
                        'name_servers', 'status', 'emails', 'org', 'country']:
                value = getattr(info, key, None)
                if value is not None and value != []:
                    result[key] = str(value) if not isinstance(value, (list, str)) else value
            return result if result else {"raw": str(info)}
        finally:
            socket.setdefaulttimeout(original_timeout)
    except Exception as e:
        return {"error": str(e)}


def detect_xss(url: str, param: str = 'q') -> Dict[str, Any]:
    """XSS detection with common payloads"""
    payloads = [
        "<script>alert(1)</script>",
        "'><svg/onload=alert(1)>",
        '";alert(1);//',
        "<img src=x onerror=alert(1)>",
        "<body onload=alert(1)>",
        "<iframe src='javascript:alert(1)'></iframe>",
        "<svg><script>alert(1)</script>",
        "<details open ontoggle=alert(1)>"
    ]
    results = []
    for payload in payloads:
        full_url = f"{url}?{param}={urllib.parse.quote(payload)}"
        try:
            res = requests.get(full_url, timeout=5)
            reflected = payload in res.text
            results.append({
                "payload": payload,
                "url": full_url,
                "reflected": reflected,
                "status": "VULNERABLE" if reflected else "safe",
                "http_status": res.status_code,
            })
        except Exception as e:
            results.append({"payload": payload, "url": full_url, "error": str(e)})
    return {"results": results, "vulnerable_count": sum(1 for r in results if r.get("reflected"))}


def port_scan(domain: str, ports: Optional[List[int]] = None) -> Dict[str, Any]:
    """Port scanning"""
    if not domain:
        return {"error": "No domain provided"}
    domain = domain.replace("http://", "").replace("https://", "").strip("/")
    try:
        ip = socket.gethostbyname(domain)
    except socket.gaierror as e:
        return {"error": f"DNS resolution failed: {str(e)}"}

    if ports is None:
        ports = [21, 22, 23, 25, 53, 80, 110, 139, 143, 443, 445, 993, 995, 3306, 3389, 5432, 8080, 8443]

    results = []
    for port in ports:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)
                code = s.connect_ex((ip, port))
                is_open = code == 0
                service = "unknown"
                banner = ""
                if is_open:
                    try:
                        service = socket.getservbyport(port, 'tcp')
                    except Exception:
                        pass
                    try:
                        s.send(b'\r\n')
                        banner = s.recv(1024).decode(errors='ignore').strip()
                    except Exception:
                        pass
                results.append({
                    "port": port,
                    "open": is_open,
                    "service": service,
                    "banner": banner
                })
        except Exception as e:
            results.append({"port": port, "error": str(e)})

    return {
        "ip": ip,
        "domain": domain,
        "results": results,
        "open_ports": [r["port"] for r in results if r.get("open")]
    }


def check_security_headers(url: str) -> Dict[str, Any]:
    """Check security headers"""
    required = [
        "Content-Security-Policy", "Strict-Transport-Security",
        "X-Content-Type-Options", "X-Frame-Options", "X-XSS-Protection",
        "Referrer-Policy", "Permissions-Policy"
    ]
    try:
        res = requests.get(url, timeout=10)
        headers = res.headers
        results = []
        for header in required:
            present = header in headers
            results.append({
                "header": header,
                "present": present,
                "value": headers.get(header, None)
            })
        score = sum(1 for r in results if r["present"])
        return {
            "results": results,
            "score": f"{score}/{len(required)}",
            "grade": "A" if score >= 6 else "B" if score >= 4 else "C" if score >= 2 else "F"
        }
    except Exception as e:
        return {"error": str(e)}


def discover_login_pages(base_url: str) -> Dict[str, Any]:
    """Discover login pages"""
    from bs4 import BeautifulSoup
    paths = [
        'login', 'admin', 'user/login', 'account/login', 'signin',
        'users/sign_in', 'administrator', 'auth/login', 'wp-login.php',
        'panel', 'dashboard', 'auth', 'session/new'
    ]
    results = []
    for path in paths:
        url = f"{base_url.rstrip('/')}/{path}"
        try:
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                soup = BeautifulSoup(res.text, 'html.parser')
                has_form = bool(soup.find('input', {'type': 'password'}))
                results.append({
                    "url": url,
                    "status": res.status_code,
                    "has_login_form": has_form,
                })
            elif res.status_code in [301, 302]:
                results.append({"url": url, "status": res.status_code, "redirected": True})
        except Exception as e:
            results.append({"url": url, "error": str(e)})

    return {"results": results, "found": [r for r in results if r.get("has_login_form")]}


def brute_force_login(login_url: str, username_field: str, password_field: str,
                      usernames: List[str], passwords: List[str]) -> Dict[str, Any]:
    """Brute force login attempt"""
    results = []
    session = requests.Session()
    for username in usernames:
        for password in passwords:
            data = {username_field: username, password_field: password}
            try:
                res = session.post(login_url, data=data, timeout=5, allow_redirects=True)
                text = res.text.lower()
                success_indicators = ["sign off", "signoff", "hello", "welcome", "dashboard", "logout"]

                if any(ind in text for ind in success_indicators) or username.lower() in text:
                    status = "success"
                elif "incorrect" in text or "invalid" in text or "failed" in text:
                    status = "failed"
                elif res.history and res.status_code == 200:
                    status = "possible_success"
                else:
                    status = "unknown"

                results.append({
                    "username": username,
                    "password": password,
                    "status": status,
                    "http_status": res.status_code
                })
            except Exception as e:
                results.append({"username": username, "password": password, "error": str(e)})

    return {
        "results": results,
        "successful": [r for r in results if r.get("status") == "success"]
    }
