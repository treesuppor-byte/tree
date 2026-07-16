# -*- coding: utf-8 -*-
# {{ANALYTICS}} 위치를 head 하단에서 viewport 바로 다음으로 옮기는 1회용 스크립트
# 사용법: python move_analytics.py  →  그다음 python build.py
import re, os

for name in os.listdir('src/pages'):
    if not name.endswith('.html'):
        continue
    path = f'src/pages/{name}'
    html = open(path, encoding='utf-8').read()

    # 1) 기존 {{ANALYTICS}}를 위치 불문하고 전부 제거 (중복 방지)
    html = re.sub(r'[ \t]*\{\{ANALYTICS\}\}\n?', '', html)

    # 2) viewport 메타태그 바로 다음 줄에 삽입
    m = re.search(r'<meta\s+name="viewport"[^>]*/?>', html)
    if m:
        pos = m.end()
        html = html[:pos] + '\n    {{ANALYTICS}}' + html[pos:]
        print(f'✓ {name}: viewport 다음으로 이동 완료')
    else:
        print(f'⚠ {name}: viewport 태그를 못 찾음 — 이 파일은 수동 확인 필요')
        continue

    open(path, 'w', encoding='utf-8').write(html)

print('\n끝! 이제 python build.py 를 실행하세요.')