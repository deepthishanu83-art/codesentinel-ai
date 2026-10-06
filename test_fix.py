import requests, json

r2 = requests.post('http://127.0.0.1:8000/api/fixes/generate', json={
    'owner': 'local', 'repo': 'uploaded-file', 'branch': 'local',
    'finding': {
        'file': 'codesentinel_demo_buggy.py', 'line': 8,
        'severity': 'critical', 'category': 'security',
        'title': 'SQL Injection',
        'description': 'User input directly concatenated into SQL query.',
        'recommendation': 'Use parameterized queries.'
    },
    'source_code': 'def fetch():\n    query = "SELECT * FROM users WHERE id=" + user_id\n    return db.execute(query)'
})
print(f'Generate status: {r2.status_code}')
print(json.dumps(r2.json(), indent=2))
