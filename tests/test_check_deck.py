import subprocess, sys, os, tempfile

CK = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'scripts', 'check-deck.py')

def run(html):
    with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
        f.write(html); p = f.name
    r = subprocess.run([sys.executable, CK, p], capture_output=True, text=True)
    os.unlink(p)
    return r.returncode, r.stdout.strip()

def mk(n, **kw):
    dims = kw.get('w','1080px') + '; height:' + kw.get('h','1350px')
    ss = ''.join('<section class="slide" style="width:' + dims + '">slide {}</section>'.format(i+1) for i in range(n))
    return '<!DOCTYPE html><html><head><meta charset=utf-8></head><body>{}</body></html>'.format(ss)

SLIDE = '<section class="slide" style="width:1080px; height:1350px">'
SLIDE_C = SLIDE + '</section>'

failures = 0
def t(name, fn):
    global failures
    try:
        fn()
        print(f'PASS {name}')
    except Exception as e:
        print(f'FAIL {name}: {e}')
        failures += 1

t('good', lambda: (lambda rc,out: rc==0 or (_ for _ in ()).throw(AssertionError(f'rc={rc}: {out}'))) and (lambda rc,out: out=='' or (_ for _ in ()).throw(AssertionError(f'output: {out}')))(*run(mk(10))) and None)

t('nine', lambda: (lambda rc,out: (rc==1 and out.startswith('SLIDE_COUNT:')) or (_ for _ in ()).throw(AssertionError(f'rc={rc}: {out}')))(*run(mk(9))) and None)

t('eleven', lambda: (lambda rc,out: (rc==1 and out.startswith('SLIDE_COUNT:')) or (_ for _ in ()).throw(AssertionError(f'rc={rc}: {out}')))(*run(mk(11))) and None)

t('dimensions', lambda: (lambda rc,out: (rc==1 and 'DIMENSIONS: slide 1' in out) or (_ for _ in ()).throw(AssertionError(f'rc={rc}: {out}')))(*run('<!DOCTYPE html><html><body><section class="slide" style="width:800px; height:1350px">x</section>' + mk(10)[mk(10).find('<section',2):])) and None)

t('external_url', lambda: (lambda rc,out: (rc==1 and 'EXTERNAL_URL' in out) or (_ for _ in ()).throw(AssertionError(f'rc={rc}: {out}')))(*run(mk(10).replace('slide 1', '<img src="https://example.com/x.png">'))) and None)

t('external_font', lambda: (lambda rc,out: (rc==1 and ('EXTERNAL_URL' in out or 'EXTERNAL_FONT' in out)) or (_ for _ in ()).throw(AssertionError(f'rc={rc}: {out}')))(*run('<!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css?family=X" rel="stylesheet"></head>' + mk(10)[mk(10).find('<body'):])) and None)

t('script', lambda: (lambda rc,out: (rc==1 and 'SCRIPT' in out) or (_ for _ in ()).throw(AssertionError(f'rc={rc}: {out}')))(*run(mk(10) + '<script>console.log(1)</script>')) and None)

t('event_handler', lambda: (lambda rc,out: (rc==1 and 'EVENT_HANDLER' in out) or (_ for _ in ()).throw(AssertionError(f'rc={rc}: {out}')))(*run(mk(10).replace('slide 1', '<button onclick="x()">btn</button>'))) and None)

t('animation', lambda: (lambda rc,out: (rc==1 and 'ANIMATION' in out) or (_ for _ in ()).throw(AssertionError(f'rc={rc}: {out}')))(*run('<!DOCTYPE html><html><head><style>.x{animation:fadeIn 1s}</style></head>' + mk(10)[mk(10).find('<body'):])) and None)

t('transition', lambda: (lambda rc,out: (rc==1 and 'ANIMATION' in out) or (_ for _ in ()).throw(AssertionError(f'rc={rc}: {out}')))(*run('<!DOCTYPE html><html><head><style>.x{transition:all 0.3s}</style></head>' + mk(10)[mk(10).find('<body'):])) and None)

t('parse', lambda: (lambda rc,out: (rc==1 and 'PARSE' in out) or (_ for _ in ()).throw(AssertionError(f'rc={rc}: {out}')))(*run('<html><body><section class=slide>unclosed')) and None)

t('missing_file', lambda: (lambda r: (r.returncode==1 and 'FILE' in r.stdout) or (_ for _ in ()).throw(AssertionError(f'rc={r.returncode}: {r.stdout}')))(subprocess.run([sys.executable, CK, '/nonexistent/deck.html'], capture_output=True, text=True)) and None)

t('multibreach', lambda: (lambda rc,out: (rc==1 and len(out.splitlines()) >= 2 and any('SLIDE_COUNT' in l for l in out.splitlines()) and any('EXTERNAL_URL' in l for l in out.splitlines())) or (_ for _ in ()).throw(AssertionError(f'rc={rc}, lines={len(out.splitlines())}: {out}')))(*run(mk(9).replace('slide 1', '<img src="https://x.com/a.png">'))) and None)

t('keyframes', lambda: (lambda rc,out: (rc==1 and 'ANIMATION' in out and '@keyframes' in out) or (_ for _ in ()).throw(AssertionError(f'rc={rc}: {out}')))(*run('<!DOCTYPE html><html><head><style>@keyframes x{from{opacity:0}to{opacity:1}}</style></head>' + mk(10)[mk(10).find('<body'):])) and None)

# Regression: void elements in slides do not corrupt slide count
t('void_elements_dont_corrupt_count', lambda: (lambda rc,out: (rc==0 and out=='') or (_ for _ in ()).throw(AssertionError(f'rc={rc}: {out}')))(*run(
    '<!DOCTYPE html><html><head><meta charset=utf-8></head><body>\n' +
    '\n'.join(
        f'{SLIDE}slide {i}' +
        (' <img src="data:image/png,ok">' if i % 2 == 0 else '') +
        (' <link rel="stylesheet" href="data:text/css,ok">' if i % 3 == 0 else '') +
        (' <br>' if i in (3,7) else '') +
        f'</section>'
        for i in range(1, 11)
    ) +
    '\n</body></html>'
)) and None)

# Regression: external font <link> reports exactly one breach line
t('font_link_one_breach', lambda: (lambda rc,out: (rc==1 and len(out.splitlines())==1 and ('EXTERNAL_URL' in out or 'EXTERNAL_FONT' in out)) or (_ for _ in ()).throw(AssertionError(f'rc={rc}, lines={len(out.splitlines())}: {out}')))(*run('<!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css?family=X" rel="stylesheet"></head>' + mk(10)[mk(10).find('<body'):])) and None)

# Regression: @font-face external src reports exactly one breach
t('font_face_one_breach', lambda: (lambda rc,out: (rc==1 and len(out.splitlines())==1 and 'EXTERNAL_FONT' in out) or (_ for _ in ()).throw(AssertionError(f'rc={rc}, lines={len(out.splitlines())}: {out}')))(*run('<!DOCTYPE html><html><head><style>@font-face{font-family:x;src:url(https://example.com/font.woff2)}</style></head>' + mk(10)[mk(10).find('<body'):])) and None)

print(f'\n{failures} failures')
sys.exit(failures)
