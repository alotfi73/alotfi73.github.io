#!/usr/bin/env python3
"""Build sitemap.xml for chemprocesseng.com.

Run from the repository root:  python3 tools/build_sitemap.py
The deploy workflow runs it on every publish, so new pages are listed automatically.

Every <folder>/.../index.html with a canonical link is listed under that canonical URL.
Pages marked <meta name="robots" content="noindex"> (search, the page template) are left out.
<lastmod> comes from the page's JSON-LD "dateModified"; pages without one get no <lastmod>.
Folders whose names are not valid slugs (spaces, capitals, underscores) are skipped, as in
build_search_index.py.

Only the Python standard library is used.
"""
import os
import re
import sys
from xml.sax.saxutils import escape

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else ".")
OUT = os.path.join(ROOT, "sitemap.xml")
SKIP_DIRS = {".git", ".github", "assets", "tools", "graphify-out", "node_modules", "_site"}
SLUG = re.compile(r"^[a-z0-9][a-z0-9-]*$")

CANONICAL = re.compile(r'<link rel="canonical" href="([^"]+)"')
NOINDEX = re.compile(r'<meta name="robots" content="[^"]*noindex')
MODIFIED = re.compile(r'"dateModified":\s*"(\d{4}-\d{2}-\d{2})"')


def pages():
    for dirpath, dirnames, filenames in os.walk(ROOT):
        rel = os.path.relpath(dirpath, ROOT)
        dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS and SLUG.match(d))
        if "index.html" in filenames:
            yield os.path.join(dirpath, "index.html"), rel


def main():
    urls = []
    for path, rel in pages():
        with open(path, encoding="utf-8") as f:
            s = f.read()
        m = CANONICAL.search(s)
        if not m or NOINDEX.search(s):
            continue
        mod = MODIFIED.search(s)
        urls.append((m.group(1), mod.group(1) if mod else None, rel))
    urls.sort(key=lambda u: (u[0].count("/"), u[0]))

    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, mod, _ in urls:
        lines.append("  <url><loc>%s</loc>%s</url>" % (escape(loc), "<lastmod>%s</lastmod>" % mod if mod else ""))
    lines.append("</urlset>")
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines) + "\n")
    print("sitemap.xml: %d URLs" % len(urls))


if __name__ == "__main__":
    main()
