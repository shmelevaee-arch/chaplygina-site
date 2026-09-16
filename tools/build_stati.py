# Страницы статей: stati/<slug>/index.html из текстов B17 (tools/stati-src/<id>.json)
# Шапка, меню, подвал и нижняя плашка берутся из index.html, чтобы не расходились.
# Запуск: python tools/build_stati.py  (после правок главной – перезапустить)
import io, json, re, html
from pathlib import Path

R = Path('E:/chaplygina-site')
TG = 'https://t.me/chaplygina_expert'
VER = re.search(r'\?v=(\w+)', (R / 'index.html').read_text(encoding='utf-8')).group(1)

# порядок = порядок в списке «Почитать»
ARTICLES = [
    dict(id='922004', slug='sozrevanie-spermatozoidov', tag='Мужчинам', word='90 дней',
         title='Путь длиной в 90 дней: как на самом деле созревают сперматозоиды'),
    dict(id='863952', slug='kod-dostupa-k-telu', tag='Желание', word='Желание',
         title='Код доступа к телу: что именно управляет вашим желанием в сексе?'),
    dict(id='921081', slug='seks-ne-knopka', tag='Сексуальность', word='Вкл / выкл',
         title='Секс – это не кнопка «вкл/выкл»'),
    dict(id='853572', slug='dostal-so-svoim-seksom', tag='Парам', word='«Достал!»',
         title='«Достал уже со своим сексом!»'),
    dict(id='880190', slug='anorgazmiya-ili-navyk', tag='Женщинам', word='Навык',
         title='Аноргазмия или несформированный навык?'),
    dict(id='908991', slug='seksualnost-do-25-let', tag='Сексуальность', word='22–25',
         title='Правда ли, что сексуальность формируется до 22–25 лет?'),
]
MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
SHORT = r'(?<![\w-])(в|во|и|к|ко|с|со|у|о|об|а|но|не|ни|на|до|от|за|по|из|то|же|ли|бы|для|без|при|про|что|как|это|я|вы|мы|он|она|их)\s+'

def typo(s):
    """Русская типографика в тексте (не трогает теги)."""
    def fix(text):
        text = text.replace('—', '–').replace(' - ', ' – ')
        text = re.sub(r'"([^"]+)"', r'«\1»', text)
        text = re.sub(SHORT, lambda m: m.group(1) + '\u00a0', text, flags=re.I)
        text = re.sub(r'(\d)\s+(лет|дней|минут|часов|см|%)', '\\1\u00a0\\2', text)
        return text
    return re.sub(r'(?<=>)([^<]+)|^([^<]+)', lambda m: fix(m.group(0)), s)

def sentence_case(h):
    """Слова, набранные капсом, – в обычный регистр; однобуквенные – если соседние тоже капсом."""
    words = h.split(' ')
    letters = [re.sub(r'[^А-Яа-яЁёA-Za-z]', '', w) for w in words]
    caps = [len(l) > 1 and l.isupper() for l in letters]
    out = []
    for i, w in enumerate(words):
        near = (i > 0 and caps[i - 1]) or (i + 1 < len(words) and caps[i + 1])
        starts = w.startswith(('«', '"')) or (i > 0 and words[i - 1].endswith(':'))  # начало фразы в кавычках – с заглавной
        if caps[i] or (len(letters[i]) == 1 and letters[i].isupper() and near and i > 0 and not starts):
            w = w.lower()
            if i == 0:
                w = re.sub(r'[а-яёa-z]', lambda m: m.group(0).upper(), w, count=1)
        out.append(w)
    return ' '.join(out)

def edit_body(a, body):
    body = body.replace('\u20e3', '')
    body = re.sub(r'<p>(\d)\s*', r'<p>\1. ', body) if a['id'] == '863952' else body
    # платформенные призывы B17: комментариев и «сохраняйте пост» на сайте нет
    def drop(m):
        sents = re.split(r'(?<=[.!?…])\s+', m.group(1))
        keep = [x for x in sents if not re.search(r'коммент|Сохраняйте пост', x, re.I)]
        return f'<p>{" ".join(keep)}</p>' if keep else ''
    body = re.sub(r'<p>(.*?)</p>', drop, body)
    # «Этап N. Название — …» – подзаголовки
    body = re.sub(r'<p>\s*<b>\s*Э?</b>?<?b?>?\s*(Этап.*?)</p>', lambda m: '<h2>' + re.sub('<[^>]+>', '', m.group(1)).strip() + '</h2>', body)
    body = re.sub(r'<p>\s*<b>(?:\s*</?b>)*\s*(Э</b><b>тап|Этап)(.*?)</p>',
                  lambda m: '<h2>' + re.sub('<[^>]+>', '', 'Этап' + m.group(2)).strip() + '</h2>', body)
    if a['id'] == '853572':
        body = body.replace('<h2>7 шокирующих причин, почему вы больше не хотите секса со своим мужем</h2>',
                            '<p><b>7 причин, почему вы больше не хотите секса со своим мужем</b></p>')
        body = re.sub(r'<ol><li><b>(.*?)</b></li>\s*</ol>', r'<h2>1. \1</h2>', body)
        body = body.replace('!!! ', '')
        head, sep, tail = body.partition('<h2>Как вернуть интерес?</h2>')
        tail = re.sub(r'<h2>(\d)\.\s*(.*?)\.?</h2>', r'<h3>\1. \2</h3>', tail)
        body = head + sep + tail
    body = re.sub(r'<h2>(.*?)</h2>', lambda m: '<h2>' + sentence_case(m.group(1)).rstrip(':').strip() + '</h2>', body)
    body = re.sub(r'\s+</p>', '</p>', body)
    return typo(body).strip()

def words(body):
    return len(re.sub('<[^>]+>', ' ', body).split())

# ---------- общие куски из главной ----------
index = (R / 'index.html').read_text(encoding='utf-8')
def cut(start, end):
    i = index.index(start); j = index.index(end, i) + len(end)
    return index[i:j]
header = cut('<header class="header', '</header>')
menu = cut('<!-- мобильное меню -->', '</div>')
footer = cut('<footer class="footer"', '</footer>')
mobile_cta = cut('<a class="btn mobile-cta"', '</a>')
def rebase(s):
    s = s.replace('href="#"', 'href="../../"')
    return re.sub(r'href="#([\w-]+)"', r'href="../../#\1"', s)
header, menu, footer = rebase(header), rebase(menu), rebase(footer)

def row(a, prefix):
    return (f'    <li data-reveal><a class="read-row" href="{prefix}{a["slug"]}/" data-cover="{a["word"]}">\n'
            f'      <span class="read-row__thumb" aria-hidden="true">{a["word"]}</span>\n'
            f'      <span class="eyebrow read-row__tag">{a["tag"]}</span>\n'
            f'      <span class="read-row__title">{typo(a["title"])}</span>\n'
            f'      <span class="read-row__arrow" aria-hidden="true">↗</span>\n'
            f'    </a></li>')

for n, a in enumerate(ARTICLES):
    d = json.loads((R / 'tools/stati-src' / f'{a["id"]}.json').read_text(encoding='utf-8'))
    body = edit_body(a, d['html'])
    y, m, day = d['date'].split('-')
    date = f'{int(day)} {MONTHS[int(m) - 1]} {y}'
    minutes = max(1, round(words(body) / 180))
    desc = html.escape(re.sub(r'\s+', ' ', re.sub('<[^>]+>', ' ', body)).strip()[:155].rsplit(' ', 1)[0] + '…')
    others = [ARTICLES[(n + k) % len(ARTICLES)] for k in (1, 2, 3)]
    title_plain = a['title']
    page = f'''<!doctype html>
<html lang="ru" class="intro">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title_plain)} – Татьяна Чаплыгина</title>
<meta name="description" content="{desc}">
<meta name="robots" content="noindex, nofollow"> <!-- черновик для показа: убрать перед запуском -->
<meta name="theme-color" content="#121212">
<meta property="og:type" content="article">
<meta property="og:locale" content="ru_RU">
<meta property="og:title" content="{html.escape(title_plain)}">
<meta property="og:description" content="{desc}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="../../favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&display=swap">
<link rel="stylesheet" href="../../css/tokens.css?v={VER}">
<link rel="stylesheet" href="../../css/base.css?v={VER}">
<link rel="stylesheet" href="../../css/hero.css?v={VER}">
<link rel="stylesheet" href="../../css/sections.css?v={VER}">
<link rel="stylesheet" href="../../css/blocks.css?v={VER}">
<link rel="stylesheet" href="../../css/article.css?v={VER}">
</head>
<body>
<!-- файл собран скриптом tools/build_stati.py – правки текста вносить туда или в tools/stati-src/{a["id"]}.json -->
{header}
<div class="read-progress" aria-hidden="true"></div>

{menu}

<main>
<header class="article-head">
  <a class="article-back fade" style="--d:.2s" href="../../#pochitat">← Все статьи</a>
  <p class="article-meta fade" style="--d:.3s"><span class="eyebrow">{a["tag"]}</span><span>{date}</span><span>{minutes}&nbsp;мин чтения</span></p>
  <h1 class="article-title"><span class="reveal-line"><span style="--d:.15s">{typo(title_plain)}</span></span></h1>
  <div class="article-cover" aria-hidden="true"><span class="reveal-line"><span style="--d:.45s">{a["word"]}</span></span></div>
</header>

<article class="section article" id="statya" aria-label="Текст статьи">
  <div class="article-body">
{body}
  </div>

  <aside class="article-author" data-reveal>
    <span class="article-author__photo" aria-hidden="true"></span>
    <div>
      <p class="card-title">Татьяна Чаплыгина</p>
      <p class="muted">Психолог и&nbsp;сексолог. Мужская психология и&nbsp;сексология, консультации онлайн и&nbsp;в&nbsp;Москве.</p>
      <a class="btn btn--red" href="{TG}" target="_blank" rel="noopener">Записаться на&nbsp;консультацию</a>
    </div>
  </aside>
</article>

<section class="section read" id="eshche" aria-labelledby="eshche-title">
  <div class="section__head"><h2 id="eshche-title" class="section__title">Ещё статьи</h2></div>
  <ul class="reads">
{chr(10).join(row(o, '../') for o in others)}
  </ul>
</section>
</main>

{footer}

{mobile_cta}

<script src="../../js/vendor/lenis.min.js?v={VER}"></script>
<script src="../../js/hero.js?v={VER}"></script>
<script src="../../js/main.js?v={VER}"></script>
<script src="../../js/blocks.js?v={VER}"></script>
<script src="../../js/article.js?v={VER}"></script>
</body>
</html>
'''
    out = R / 'stati' / a['slug'] / 'index.html'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(page, encoding='utf-8', newline='\n')
    print(a['slug'], words(body), 'слов', minutes, 'мин', body.count('<h2>'), 'h2', body.count('<h3>'), 'h3')

# ---------- список на главной: строки ведут на наши страницы ----------
rows = '\n'.join(row(a, 'stati/') for a in ARTICLES)
new_index, k = re.subn(r'  <ul class="reads">.*?\n  </ul>', lambda m: '  <ul class="reads">\n' + rows + '\n  </ul>', index, count=1, flags=re.S)
assert k == 1
new_index = new_index.replace('Все статьи на&nbsp;B17</a><span class="todo">статьи переедут на сайт</span>', 'Ещё статьи на&nbsp;B17</a>')
(R / 'index.html').write_text(new_index, encoding='utf-8', newline='\n')
print('index ok')
