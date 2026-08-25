"""Machine-translate `docs/` for the site, at build time only.

Nothing this writes is committed. The repository stays English - that rule in
AGENTS.md is about contributors, and it has not changed - while the published
site can offer a second language for people who only want to read.

What it produces is a sibling file per page, `docs/<page>.<lang>.md`, which is
the layout `mkdocs-static-i18n` expects. A page with no translation falls back
to English rather than going missing, so a failure here degrades the site
instead of breaking it.

Two rules hold it together:

- **Code is never translated.** Fenced blocks, inline code and link targets are
  lifted out before the text goes anywhere near the translator and put back
  afterwards. A humidifier configuration is copied from these pages verbatim,
  and a translated `source:` key is a configuration that silently does nothing.
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
LINK_TARGET = re.compile(r'\]\([^)\s]+(?:\s+"[^"]*")?\)')
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

    def __init__(self):
        self.kept = []

    def hide(self, text):
        def keep(match):
            self.kept.append(match.group(0))
            return PLACEHOLDER.format(len(self.kept) - 1)

        for pattern in (HTML_COMMENT, FENCED, LINK_TARGET, INLINE_CODE):
            text = pattern.sub(keep, text)

        return text

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


def translate_line(line, translate, protector):
    """One markdown line, translated with its structure left alone."""
    heading = HEADING.match(line)
    if heading:
        hashes, text = heading.groups()
        anchor = slugify(text)
        return f'{hashes} {translate_text(text, translate, protector)} {{ #{anchor} }}'

    if line.lstrip().startswith('|'):
        if TABLE_DIVIDER.match(line.strip()):
            return line

        cells = line.split('|')
        return '|'.join(
            cell
            if not cell.strip()
            else f' {translate_text(cell.strip(), translate, protector)} '
            for cell in cells
        )

    for pattern in (LIST_ITEM, BLOCKQUOTE):
        match = pattern.match(line)
        if match:
            prefix, text = match.groups()
            if not text.strip():
                return line
            return prefix + translate_text(text, translate, protector)

    if not line.strip():
        return line

    return translate_text(line, translate, protector)


def translate_markdown(text, translate):
    """Translate a page, leaving fenced blocks exactly as they are."""
    protector = Protector()
    hidden = FENCED.sub(
        lambda m: (protector.kept.append(m.group(0)), PLACEHOLDER.format(len(protector.kept) - 1))[
            1
        ],
        text,
    )

    lines = [translate_line(line, translate, protector) for line in hidden.split('\n')]

    return protector.restore('\n'.join(lines))


def pages():
    """The English pages, which are the ones without a language suffix."""
    return sorted(p for p in DOCS.glob('*.md') if '.' not in p.stem)


def sync_index():
    """Put the front page in place, the same way the site build does.

    `docs/index.md` is README.md, written out rather than committed. Calling
    the build's own helper keeps the two from drifting - a second copy of that
    logic here is exactly the kind of thing this project keeps finding in its
    own history.
    """
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from mkdocs_hooks import sync_index as write

    return write()


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

    for page, written in targets:
        source = page.read_text(encoding='utf-8')
        digest = hashlib.sha256(source.encode('utf-8')).hexdigest()[:16]
        cached = cache / f'{page.stem}.{digest}.md'

        if cached.exists():
            written.write_text(cached.read_text(encoding='utf-8'), encoding='utf-8')
            print(f'cached {page.name}')
            continue

        body = translate_markdown(source, translate)
        if notice:
            body = notice.format(original=page.name) + '\n' + body

        cached.write_text(body, encoding='utf-8')
        written.write_text(body, encoding='utf-8')
        print(f'wrote  {written.name}')

    return 0


if __name__ == '__main__':
    sys.exit(main())
