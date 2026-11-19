"""SQL check for the parish portal: applies cloudflare/schema.sql, then every file in cloudflare/migrations/ in order,
to an empty SQLite database (D1 is SQLite), and compiles every statement parishes-worker.js prepares against it
(EXPLAIN, so a wrong table or column name fails here and not on the live database).
Prints each failure, then "sql ok N statements" or "sql bad N".
Usage (from the repo root or verbumdomini/): python3 verbumdomini/tools/qa/parish-sql.py"""
import glob, os, re, sqlite3, sys

CF = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'cloudflare')
db = sqlite3.connect(':memory:')
bad = 0
for f in [os.path.join(CF, 'schema.sql')] + sorted(glob.glob(os.path.join(CF, 'migrations', '*.sql'))):
    try: db.executescript(open(f, encoding='utf-8').read())
    except sqlite3.Error as e: print(f'{os.path.basename(f)}: {e}'); bad += 1
# Applying the base again must stay harmless (every statement in schema.sql is IF NOT EXISTS)
try: db.executescript(open(os.path.join(CF, 'schema.sql'), encoding='utf-8').read())
except sqlite3.Error as e: print(f'schema.sql (second run): {e}'); bad += 1

src = open(os.path.join(CF, 'parishes-worker.js'), encoding='utf-8').read()
# prepare('...') or prepare("...") with string pieces joined by +; a piece that is code (a ternary) becomes '' or its first literal
LIT = r"'(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\"|`(?:[^`\\]|\\.)*`"
stmts = []
for m in re.finditer(r'\.prepare\(', src):
    i, depth, j = m.end(), 1, m.end()
    while depth and j < len(src):
        c = src[j]
        if c in '\'"`':
            k = j + 1
            while src[k] != c: k += 2 if src[k] == '\\' else 1
            j = k
        elif c == '(': depth += 1
        elif c == ')': depth -= 1
        j += 1
    arg = src[i:j - 1]
    parts = re.findall(r'\(\s*[^()]*\?\s*(' + LIT + r')\s*:\s*(?:' + LIT + r')\s*\)|(' + LIT + ')', arg)
    sql = ''.join((a or b)[1:-1] for a, b in parts)
    sql = re.sub(r'\$\{[^}]*\}', '1', sql).replace("\\'", "'")
    if sql.strip(): stmts.append(sql)
for s in stmts:
    try: db.execute('EXPLAIN ' + s, [None] * s.count('?'))
    except sqlite3.Error as e: print(f'{e}: {s[:160]}'); bad += 1
print(f'sql bad {bad}' if bad else f'sql ok {len(stmts)} statements')
sys.exit(1 if bad else 0)
