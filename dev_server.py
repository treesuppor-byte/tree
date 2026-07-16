# -*- coding: utf-8 -*-
"""
Supportree 로컬 테스트 서버 (GitHub Pages 배포 구조용)
사용법: index.html이 있는 폴더에서 실행
    python dev_server.py
브라우저에서 http://127.0.0.1:8000 접속
GitHub Pages처럼 /about → about.html 로 연결하고,
없는 주소는 404 상태코드와 함께 404.html을 보여줍니다.
"""
import http.server
import socketserver
import os
import urllib.parse

PORT = 8000
ROOT = os.path.dirname(os.path.abspath(__file__))

class DevHandler(http.server.SimpleHTTPRequestHandler):
    def resolve(self, path):
        path = urllib.parse.urlparse(path).path
        full = os.path.normpath(os.path.join(ROOT, path.lstrip("/")))
        if os.path.isdir(full):
            index = os.path.join(full, "index.html")
            if os.path.isfile(index):
                return index, 200
        if os.path.isfile(full):
            return full, 200
        # GitHub Pages처럼 확장자 없는 주소를 .html에 연결
        candidate = full.rstrip("/") + ".html"
        if os.path.isfile(candidate):
            return candidate, 200
        return os.path.join(ROOT, "404.html"), 404

    def do_GET(self):
        filepath, status = self.resolve(self.path)
        if status == 404 and os.path.isfile(filepath):
            body = open(filepath, "rb").read()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
            return
        # 정상 파일은 기본 처리 (경로만 바꿔치기)
        self._resolved = filepath
        super().do_GET()

    def translate_path(self, path):
        return getattr(self, "_resolved", super().translate_path(path))

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), DevHandler) as httpd:
        print(f"서버 시작! 브라우저에서 http://127.0.0.1:{PORT} 를 여세요")
        print("종료하려면 Ctrl + C")
        httpd.serve_forever()
