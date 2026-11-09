"""Write sitemap.xml with every page on the site.

usage: python3 tools/sitemap.py   (from the repo root, after adding or changing pages)

A page is any index.html outside design/ and tools/. Its date is its last commit, or today if it has
changes not yet committed, so run this just before committing.
"""
import subprocess
from datetime import date
from pathlib import Path

SITE = "https://whiteboxacademy.in"
SKIP = {"design", "tools", ".git"}


def git(*args):
    return subprocess.run(["git", *args], capture_output=True, text=True, check=True).stdout.strip()


def last_changed(path):
    if git("status", "--porcelain", "--", str(path)):
        return date.today().isoformat()
    return git("log", "-1", "--format=%cs", "--", str(path)) or date.today().isoformat()


def main():
    pages = sorted((p for p in Path(".").rglob("index.html") if not SKIP & set(p.parts)), key=lambda p: (len(p.parts), p.as_posix()))
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for page in pages:
        folder = page.parent.as_posix()
        url = f"{SITE}/" if folder == "." else f"{SITE}/{folder}/"
        lines.append(f"  <url><loc>{url}</loc><lastmod>{last_changed(page)}</lastmod></url>")
    lines.append("</urlset>")
    Path("sitemap.xml").write_text("\n".join(lines) + "\n")
    print(f"Wrote sitemap.xml with {len(pages)} pages")


if __name__ == "__main__":
    main()
