# -*- coding: utf-8 -*-
"""
Supportree 빌드 스크립트
src/ 안의 페이지·파셜·설정을 조립해서 루트에 배포용 HTML을 생성합니다.

사용법:
    python build.py

수정하는 곳:
    src/config.json          ← 전화번호, 카톡 링크, 이메일 (한 곳만 바꾸면 전 페이지 반영)
    src/partials/header.html ← 상단 내비게이션 (전 페이지 공통)
    src/partials/footer.html ← 하단 푸터 (전 페이지 공통)
    src/partials/analytics.html ← GA4 등 공통 <head> 코드
    src/pages/*.html         ← 각 페이지의 메타태그와 본문

루트의 index.html 등은 자동 생성되므로 직접 수정하지 마세요!
"""
import json
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")

BANNER = "<!-- 자동 생성된 파일입니다. 직접 수정하지 말고 src/ 폴더를 수정한 뒤 python build.py 를 실행하세요. -->\n"

def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()

def main():
    config = json.load(open(os.path.join(SRC, "config.json"), encoding="utf-8"))
    partials = {
        "HEADER": read(os.path.join(SRC, "partials", "header.html")),
        "FOOTER": read(os.path.join(SRC, "partials", "footer.html")),
        "ANALYTICS": read(os.path.join(SRC, "partials", "analytics.html")),
    }

    pages_dir = os.path.join(SRC, "pages")
    for name in sorted(os.listdir(pages_dir)):
        if not name.endswith(".html"):
            continue
        html = read(os.path.join(pages_dir, name))

        # 1) 파셜 삽입
        for key, value in partials.items():
            html = html.replace("{{" + key + "}}", value)

        # 2) 연락처 등 설정값 치환
        for key, value in config.items():
            html = html.replace("{{" + key + "}}", value)

        # 3) 치환 안 된 플레이스홀더가 있으면 경고
        import re
        leftover = re.findall(r"\{\{[A-Z_]+\}\}", html)
        if leftover:
            print(f"  ⚠ {name}: 치환되지 않은 플레이스홀더 {set(leftover)}")

        # 4) 루트에 출력 (doctype 다음 줄에 안내 배너 삽입)
        if html.lstrip().lower().startswith("<!doctype"):
            first_nl = html.index("\n") + 1
            html = html[:first_nl] + BANNER + html[first_nl:]
        else:
            html = BANNER + html

        out = os.path.join(ROOT, name)
        with open(out, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"  ✓ {name} 생성")

    print("빌드 완료! python dev_server.py 로 확인하세요.")

if __name__ == "__main__":
    main()
