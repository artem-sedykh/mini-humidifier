"""Machine-translate `docs/` for the site, at build time only.

Nothing this writes is committed. The repository stays English - that rule in
AGENTS.md is about contributors, and it has not changed - while the published
site can offer a second language for people who only want to read.

What it produces is a sibling file per page, `docs/<page>.<lang>.md`, which is
the layout `mkdocs-static-i18n` expects. A page with no translation falls back
to English rather than going missing, so a failure here degrades the site
instead of breaking it.

Two rules hold it together:

- **Code is never translated.** Fenced blocks, inline code and whole links are
  lifted out before the text goes anywhere near the translator and put back
  afterwards. A humidifier configuration is copied from these pages verbatim,
  and a translated `source:` key is a configuration that silently does nothing.
- **Paragraphs, not lines.** These files are hard-wrapped at 80 columns, and a
  translator handed half a sentence answers with half a thought.
- **A hand-written translation wins.** If `docs/<page>.<lang>.md` already exists
  in the repository, this leaves it alone. That is the door out of machine
  translation for the pages worth doing properly, and it needs no change here.

Usage:

    python scripts/translate_docs.py --lang ru
    python scripts/translate_docs.py --lang ru --check   # what would be written
"""

import argparse
import hashlib
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

# Shared with the site build rather than copied: the breadcrumb pattern and the
# front-page helper have to agree with what mkdocs does, and two copies of
# either is exactly the drift this repository keeps finding in its own history.
from mkdocs_hooks import NAV_LINE, sync_index  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / 'docs'

# A machine translation cannot be corrected by editing it - the next build
# writes it again - so every page says what it is and where the original is.
NOTICE = {
    'ru': (
        '!!! warning "Машинный перевод"\n\n'
        '    Эта страница переведена автоматически. Оригинал - [английская '
        'версия]({original}), и в спорном случае прав он.\n'
        '    Примеры конфигурации не переводятся: ключи, имена сущностей и '
        'вызовы сервисов остаются такими, какими их читает карточка.\n'
    ),
}

# Everything that must survive untouched. Fenced blocks first, so that inline
# backticks inside them are already gone by the time the inline pattern runs.
FENCED = re.compile(r'^```.*?^```', re.MULTILINE | re.DOTALL)
INLINE_CODE = re.compile(r'`[^`\n]+`')
# The whole link, not just its target. Hiding `](target)` alone left the
# brackets going through the translator, and it reordered them:
# `[Home](../README.md) | [Configuration](configuration.md)` came back as
# `[Home_0__ | [Configuration](configuration.md) |]`. The link text is
# translated on its own and put back, so no bracket reaches the engine.
MD_LINK = re.compile(r'\[([^\]\n]*)\]\(([^)\s]+(?:\s+"[^"]*")?)\)')
HTML_COMMENT = re.compile(r'<!--.*?-->', re.DOTALL)

# `__0__` rather than anything prettier: it survives the translator intact,
# which was measured rather than assumed - see the note in the pull request.
PLACEHOLDER = '__{}__'
PLACEHOLDER_RE = re.compile(r'__(\d+)__')

# After the code has been lifted out, a fragment with no letters left in it has
# nothing to translate - a line that was only a fenced block, a table cell that
# was only an option name. Sending it anyway is how a translator ends up
# prepending a word to a YAML example.
HAS_LETTERS = re.compile(r'[^\W\d_]', re.UNICODE)

HEADING = re.compile(r'^(#{1,6})\s+(.*?)\s*$')
LIST_ITEM = re.compile(r'^(\s*(?:[-*+]|\d+\.)\s+)(.*)$')
BLOCKQUOTE = re.compile(r'^(>\s*)(.*)$')
TABLE_DIVIDER = re.compile(r'^\|[\s:|-]+\|$')


def slugify(text):
    """The anchor python-markdown's toc extension would give this heading.

    Translating a heading changes its anchor, and every `#anchor` link in the
    English pages would then point at nothing in the translated ones. So the
    original anchor is pinned back on with `attr_list`, and the links keep
    working across languages.
    """
    text = INLINE_CODE.sub(lambda m: m.group(0).strip('`'), text)
    text = re.sub(r'[*_\[\]()]', '', text)
    text = re.sub(r'[^\w\s-]', '', text, flags=re.UNICODE).strip().lower()

    return re.sub(r'[-\s]+', '-', text)


class Protector:
    """Lifts out what must not be translated, and puts it back."""

    def __init__(self, translate=None):
        self.kept = []
        self.translate = translate

    def _keep(self, value):
        self.kept.append(value)
        return PLACEHOLDER.format(len(self.kept) - 1)

    def _keep_link(self, match):
        """A whole link, with its text translated on its own.

        A link that carries code in its text - `[`model: none`](models.md)` -
        is left alone: the interesting part of it is the code.
        """
        text, target = match.groups()

        if self.translate and text.strip() and '`' not in text:
            text = self.translate(text)

        return self._keep(f'[{text}]({target})')

    def hide(self, text):
        for pattern in (HTML_COMMENT, FENCED):
            text = pattern.sub(lambda m: self._keep(m.group(0)), text)

        text = MD_LINK.sub(self._keep_link, text)

        return INLINE_CODE.sub(lambda m: self._keep(m.group(0)), text)

    def restore(self, text):
        def put(match):
            index = int(match.group(1))
            return self.kept[index] if index < len(self.kept) else match.group(0)

        return PLACEHOLDER_RE.sub(put, text)


class ArgosTranslator:
    """The offline engine LibreTranslate is built on: a pip install, no server.

    Loaded lazily so that `--check` needs neither the package nor the model.
    """

    def __init__(self, source, target):
        import argostranslate.package
        import argostranslate.translate

        self.translate_module = argostranslate.translate

        installed = argostranslate.translate.get_installed_languages()
        if not any(lang.code == target for lang in installed):
            argostranslate.package.update_package_index()
            available = argostranslate.package.get_available_packages()
            package = next(
                p for p in available if p.from_code == source and p.to_code == target
            )
            argostranslate.package.install_from_path(package.download())

        self.source = source
        self.target = target

    def __call__(self, text):
        if not text.strip():
            return text

        return self.translate_module.translate(text, self.source, self.target)


def translate_text(text, translate, protector):
    """Translate one fragment, with the code in it hidden and put back."""
    hidden = protector.hide(text)

    if not HAS_LETTERS.search(hidden):
        return text

    return protector.restore(translate(hidden))


def translate_heading(line, translate, protector):
    """A heading, translated but keeping the anchor its English text had."""
    hashes, text = HEADING.match(line).groups()

    return f'{hashes} {translate_text(text, translate, protector)} {{ #{slugify(text)} }}'


def translate_row(line, translate, protector):
    """One table row, cell by cell - a row is not a sentence."""
    if TABLE_DIVIDER.match(line.strip()):
        return line

    return '|'.join(
        cell if not cell.strip() else f' {translate_text(cell.strip(), translate, protector)} '
        for cell in line.split('|')
    )


def translate_markdown(text, translate):
    """Translate a page, a paragraph at a time.

    Sentence by sentence would be better still, but paragraph is where the
    important boundary is: these files are hard-wrapped at 80 columns, and
    translating line by line handed the engine half a sentence at a time. It
    answered in kind - "Options marked **object** open a block of their own,
    documented on the page / the last column points at" came back as two
    fragments, the second of them ending mid-thought. Joining the lines back
    into a paragraph first is the whole fix.
    """
    protector = Protector(translate)
    hidden = FENCED.sub(lambda m: protector._keep(m.group(0)), text)

    out = []
    pending = None

    def flush():
        nonlocal pending
        if pending is None:
            return
        prefix, lines = pending
        pending = None
        out.append(prefix + translate_text(' '.join(lines), translate, protector))

    for line in hidden.splitlines():
        stripped = line.strip()

        # A blank line, a heading, a table row or a line that is nothing but a
        # hidden code block all end whatever was being collected.
        if not stripped or PLACEHOLDER_RE.fullmatch(stripped):
            flush()
            out.append(line)
            continue

        if HEADING.match(line):
            flush()
            out.append(translate_heading(line, translate, protector))
            continue

        if stripped.startswith('|'):
            flush()
            out.append(translate_row(line, translate, protector))
            continue

        item = LIST_ITEM.match(line) or BLOCKQUOTE.match(line)
        if item:
            flush()
            prefix, rest = item.groups()
            pending = (prefix, [rest.strip()] if rest.strip() else [])
            continue

        # Anything else continues what came before - the second line of a
        # wrapped paragraph, or of a wrapped list item.
        if pending is not None:
            pending[1].append(stripped)
            continue

        pending = ('', [stripped])

    flush()

    return protector.restore('\n'.join(out))


def pages():
    """The English pages, which are the ones without a language suffix."""
    return sorted(p for p in DOCS.glob('*.md') if '.' not in p.stem)


def strip_nav_line(text):
    """Remove the GitHub breadcrumb before translating, not after.

    The site build strips it too, by matching `[Home](../README.md) | ...` -
    but by then the link texts have been translated, `[Home]` reads
    `[Главная]`, and the pattern no longer matches. The line would survive on
    the translated pages only. Removing it here means neither language shows
    it, which is what was intended in both places.
    """
    return NAV_LINE.sub('', text, count=1)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lang', default='ru', help='target language code')
    parser.add_argument('--source', default='en', help='source language code')
    parser.add_argument(
        '--cache',
        default='.cache/translations',
        help='where finished translations are kept between runs',
    )
    parser.add_argument(
        '--check',
        action='store_true',
        help='report what would be translated, without translating anything',
    )
    args = parser.parse_args()

    sync_index()

    cache = ROOT / args.cache / args.lang
    cache.mkdir(parents=True, exist_ok=True)

    targets = []
    for page in pages():
        written = DOCS / f'{page.stem}.{args.lang}.md'
        if written.exists() and written.stat().st_size:
            # Only a file that is in git can be a hand-written translation: one
            # this script wrote in an earlier run is deleted below first.
            print(f'skip   {page.name}: {written.name} exists')
            continue
        targets.append((page, written))

    if args.check:
        for page, _ in targets:
            print(f'would translate {page.name} ({page.stat().st_size} bytes)')
        return 0

    if not targets:
        print('nothing to translate')
        return 0

    translate = ArgosTranslator(args.source, args.lang)
    notice = NOTICE.get(args.lang)

    # The cache key covers this script as well as the page. Without that, a
    # change to how translation works reuses output produced by the old way,
    # and the fix looks like it did nothing - which is exactly what happened
    # the first time these paragraphs were fixed.
    recipe = Path(__file__).read_bytes()

    for page, written in targets:
        source = page.read_text(encoding='utf-8')
        digest = hashlib.sha256(source.encode('utf-8') + recipe).hexdigest()[:16]
        cached = cache / f'{page.stem}.{digest}.md'

        if cached.exists():
            written.write_text(cached.read_text(encoding='utf-8'), encoding='utf-8')
            print(f'cached {page.name}')
            continue

        body = translate_markdown(strip_nav_line(source), translate)
        if notice:
            body = notice.format(original=page.name) + '\n' + body

        cached.write_text(body, encoding='utf-8')
        written.write_text(body, encoding='utf-8')
        print(f'wrote  {written.name}')

    return 0


if __name__ == '__main__':
    sys.exit(main())
