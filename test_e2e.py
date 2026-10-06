import urllib.request, json

BASE = 'http://localhost:8000'

def post(path, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(BASE+path, data=body, headers={'Content-Type': 'application/json'})
    try:
        r = urllib.request.urlopen(req)
        return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        print('HTTP Error:', e.code, e.read().decode())
        raise

# Test A: Unused Import
print('=== TEST A: Unused Import ===')
code_a = "import re\n\ndef hello():\n    return 'hello'"
res = post('/api/fixes/generate', {
    'owner': 'local', 'repo': 'uploaded-file', 'branch': 'local',
    'source_code': code_a,
    'finding': {
        'file': 'a.py', 'line': 1, 'severity': 'low',
        'category': 'code_smell', 'title': 'Unused Import',
        'description': 'Unused import re', 'recommendation': 'Remove unused imports',
        'evidence': 'import re',
        'raw_category': 'Unused Import'
    }
})
fix = res.get('fix', res)
print('auto_fix:', fix.get('auto_fix'), '| confidence:', fix.get('confidence'))
print('fixed_code:\n' + fix.get('fixed_code', '(empty)'))
val = post('/api/fixes/validate', {'fixed_code': fix.get('fixed_code', '')})
print('validation success:', val.get('success'), '|', val.get('validation_detail'))

print()
print('=== TEST B: SQL Injection ===')
code_b = 'def get_user(db, user_id):\n    query = "SELECT * FROM users WHERE id=" + user_id\n    return db.execute(query)'
res = post('/api/fixes/generate', {
    'owner': 'local', 'repo': 'uploaded-file', 'branch': 'local',
    'source_code': code_b,
    'finding': {
        'file': 'b.py', 'line': 2, 'severity': 'critical',
        'category': 'security', 'title': 'SQL Injection',
        'description': 'SQL Injection via string concatenation', 'recommendation': 'Use parameterized queries',
        'evidence': 'query = "SELECT * FROM users WHERE id=" + user_id',
        'raw_category': 'SQL Injection'
    }
})
fix = res.get('fix', res)
print('auto_fix:', fix.get('auto_fix'), '| confidence:', fix.get('confidence'))
print('fixed_code:\n' + fix.get('fixed_code', '(empty)'))
val = post('/api/fixes/validate', {'fixed_code': fix.get('fixed_code', '')})
print('validation success:', val.get('success'), '|', val.get('validation_detail'))

print()
print('=== TEST C: Mutable Default ===')
code_c = "def add_item(item, items=[]):\n    items.append(item)\n    return items"
res = post('/api/fixes/generate', {
    'owner': 'local', 'repo': 'uploaded-file', 'branch': 'local',
    'source_code': code_c,
    'finding': {
        'file': 'c.py', 'line': 1, 'severity': 'medium',
        'category': 'bug', 'title': 'Mutable Default Argument',
        'description': 'Mutable default argument', 'recommendation': 'Use None',
        'evidence': 'items=[]',
        'raw_category': 'Mutable Default Argument'
    }
})
fix = res.get('fix', res)
print('auto_fix:', fix.get('auto_fix'), '| confidence:', fix.get('confidence'))
print('fixed_code:\n' + fix.get('fixed_code', '(empty)'))
val = post('/api/fixes/validate', {'fixed_code': fix.get('fixed_code', '')})
print('validation success:', val.get('success'), '|', val.get('validation_detail'))

print()
print('=== TEST VAL FAIL: empty code ===')
val_fail = post('/api/fixes/validate', {'fixed_code': ''})
print('success:', val_fail.get('success'), '| detail:', val_fail.get('validation_detail'))

print()
print('=== TEST VAL FAIL: syntax error ===')
val_err = post('/api/fixes/validate', {'fixed_code': 'def broken(\n    pass'})
print('success:', val_err.get('success'), '| detail:', val_err.get('validation_detail'), '| errors:', val_err.get('errors'))
