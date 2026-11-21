#!/usr/bin/env python3
"""Build the site search index for chemprocesseng.com.

Run from the repository root:  python3 tools/build_search_index.py
The deploy workflow runs it on every publish, so new and changed pages are searchable automatically.

It reads every <folder>/.../index.html, keeps the text inside <main> (skipping navigation, footers,
scripts, styles, SVG drawings, form controls and tables of contents), splits each page into sections
at its h2/h3 headings, and writes assets/search/index.json:

  {"built": "...", "pages": [{"u": url, "t": title, "k": kind, "d": description}],
   "entries": [{"p": page number, "a": anchor id, "h": heading, "x": text}]}

Pages whose content is drawn by JavaScript from a data file are indexed from that file too:
lessons/nppe/nppe-guide.json adds every guide section and practice question, with anchors that
open the guide at that place (#section-iv--sub-id, #practice-iv--q-IV-03).

Folders whose names are not valid slugs (spaces, capitals, underscores) are not pages and are skipped,
so old copies such as "NPPE Study Guide/" never reach the results.

Only the Python standard library is used.
"""
import datetime
import html.parser
import json
import os
import re
import sys

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else ".")
OUT = os.path.join(ROOT, "assets", "search", "index.json")

SKIP_DIRS = {".git", ".github", "assets", "tools", "search", "node_modules"}
# Section and home pages only list other pages, so they are left out of the results.
LISTING_PAGES = {"/", "/calculators/", "/lessons/", "/data/", "/analysis/"}
KINDS = [("/lessons/", "Lesson"), ("/calculators/", "Calculator"), ("/data/", "Data tool"),
         ("/analysis/", "Analysis"), ("/about/", "About")]
TITLE_SUFFIXES = [" · ChemProcessEng", " · Chemical Process Engineering", " · Alireza Moghaddam"]

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param",
        "source", "track", "wbr"}
SKIP_TAGS = {"script", "style", "noscript", "svg", "template", "button", "select", "textarea",
             "nav", "footer", "canvas", "math"}
SKIP_CLASSES = {"nav", "skip", "toc", "crumb", "site-nav", "site-foot", "foot"}


class PageParser(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []          # (tag, skip, id)
        self.in_main = 0
        self.title = ""
        self.in_title = False
        self.title_done = False
        self.desc = ""
        self.segments = [{"a": "", "h": "", "x": []}]
        self.heading = None      # list collecting heading text while inside h2/h3

    def skipping(self):
        return any(s for _, s, _ in self.stack)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "meta" and a.get("name") == "description":
            self.desc = (a.get("content") or "").strip()
        if tag == "title" and not self.title_done:
            self.in_title = True
        if tag in VOID:
            self.text(" ")
            return
        cls = set((a.get("class") or "").split())
        skip = (tag in SKIP_TAGS or bool(cls & SKIP_CLASSES) or a.get("aria-hidden") == "true"
                or (tag == "header" and "nav" in cls))
        self.stack.append((tag, skip, a.get("id")))
        if tag == "main":
            self.in_main += 1
        if self.in_main and not self.skipping() and tag in ("h2", "h3"):
            anchor = a.get("id")
            if not anchor:
                for _, _, sid in reversed(self.stack[:-1]):
                    if sid:
                        anchor = sid
                        break
            self.segments.append({"a": anchor or "", "h": "", "x": []})
            self.heading = []
        self.text(" ")

    def handle_startendtag(self, tag, attrs):
        if tag == "meta":
            self.handle_starttag(tag, attrs)
        else:
            self.text(" ")

    def handle_endtag(self, tag):
        if tag == "title" and self.in_title:
            self.in_title = False
            self.title_done = True
        if tag in VOID:
            return
        if tag in ("h2", "h3") and self.heading is not None and not self.skipping():
            self.segments[-1]["h"] = re.sub(r"\s+", " ", "".join(self.heading)).strip()
            self.heading = None
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                if tag == "main":
                    self.in_main = max(0, self.in_main - 1)
                del self.stack[i:]
                break
        self.text(" ")

    def handle_data(self, data):
        if self.in_title:
            self.title += data
            return
        self.text(data)

    def text(self, s):
        if not self.in_main or self.skipping():
            return
        if self.heading is not None:
            self.heading.append(s)
        else:
            self.segments[-1]["x"].append(s)


def page_url(rel):
    d = os.path.dirname(rel).replace(os.sep, "/")
    return "/" if d in ("", ".") else "/" + d.strip("/") + "/"


def kind_of(url):
    for prefix, k in KINDS:
        if url.startswith(prefix):
            return k
    return "Page"


def clean(s):
    return re.sub(r"\s+", " ", s or "").strip()


SLUG = re.compile(r"[a-z0-9][a-z0-9-]*")


def md_plain(s):
    """Strip the light markdown used in the NPPE guide: [text](url), **bold**, *italic*, `code`."""
    s = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", s or "")
    return re.sub(r"[*`]", "", s)


def block_text(b):
    t = b.get("type")
    if t == "list":
        out = []
        def walk(lst):
            for it in lst.get("items", []):
                out.append(it.get("text", ""))
                if it.get("children"):
                    walk(it["children"])
        walk(b)
        return " ".join(out)
    if t == "table":
        return " ".join(b.get("header", []) + [" ".join(r) for r in b.get("rows", [])])
    if t == "note":
        return (b.get("label") or "") + ". " + (b.get("text") or "")
    return b.get("text") or ""


def nppe_entries(path, pi):
    """Entries for the NPPE study guide, whose text lives in nppe-guide.json."""
    with open(path, encoding="utf-8") as f:
        g = json.load(f)
    if g.get("schema") != "nppe-guide/1":
        return []
    out = []
    for p in g.get("pages", []):
        label = ("Section " + p["section"] + ", " + p["title"]) if p.get("section") else p["title"]
        lead = " ".join([p.get("standfirst") or ""] + [block_text(b) for b in p.get("lead", [])])
        if clean(md_plain(lead)):
            out.append({"p": pi, "a": p["id"], "h": label, "x": clean(md_plain(lead))})
        for s in p.get("subsections", []):
            x = clean(md_plain(" ".join(block_text(b) for b in s.get("blocks", []))))
            out.append({"p": pi, "a": p["id"] + "--" + s["id"], "h": s["title"] + " (" + label + ")", "x": x})
    for q in g.get("practice", {}).get("questions", []):
        x = " ".join([q["question"]] + [o["key"] + ". " + o["text"] for o in q["options"]] + [q.get("explanation", "")])
        out.append({"p": pi, "a": "practice-" + q["section"].lower() + "--q-" + q["id"],
                    "h": "Practice question " + q["id"] + ": " + q.get("topic", ""), "x": clean(md_plain(x))})
    return out


# Data files that hold the text of a JavaScript-drawn page, by page folder.
DATA_SOURCES = {"/lessons/nppe/": ("nppe-guide.json", nppe_entries)}


def main():
    pages, entries = [], []
    files = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = sorted(d for d in dirnames
                             if d not in SKIP_DIRS and not d.startswith(".") and SLUG.fullmatch(d))
        if "index.html" in filenames:
            files.append(os.path.relpath(os.path.join(dirpath, "index.html"), ROOT))
    for rel in sorted(files):
        url = page_url(rel)
        if url in LISTING_PAGES:
            continue
        with open(os.path.join(ROOT, rel), encoding="utf-8", errors="replace") as f:
            src = f.read()
        p = PageParser()
        p.feed(src)
        title = clean(p.title)
        for suf in TITLE_SUFFIXES:
            if title.endswith(suf):
                title = title[: -len(suf)]
        if not title:
            continue
        pi = len(pages)
        pages.append({"u": url, "t": title, "k": kind_of(url), "d": clean(p.desc)})
        for seg in p.segments:
            x = clean("".join(seg["x"]))
            h = clean(seg["h"])
            if not x and not h:
                continue
            entries.append({"p": pi, "a": seg["a"], "h": h, "x": x})
        if url in DATA_SOURCES:
            name, fn = DATA_SOURCES[url]
            data_path = os.path.join(ROOT, os.path.dirname(rel), name)
            if os.path.exists(data_path):
                entries.extend(fn(data_path, pi))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    data = {"built": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%MZ"),
            "pages": pages, "entries": entries}
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Search index: {len(pages)} pages, {len(entries)} sections, "
          f"{os.path.getsize(OUT) // 1024} KB -> {os.path.relpath(OUT, ROOT)}")


if __name__ == "__main__":
    main()
