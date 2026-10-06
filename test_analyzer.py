import sys
sys.path.insert(0, '.')
from ai_engine.analyzers.bug_analyzer import BugAnalyzer
from ai_engine.analyzers.code_quality_analyzer import CodeQualityAnalyzer

code_a = 'import re\n\ndef hello():\n    return "hello"'

ba = BugAnalyzer()
qa = CodeQualityAnalyzer()

issues = ba.analyze('a.py', 'python', code_a)
issues += qa.analyze('a.py', 'python', code_a)
print("=== Analyzer output for unused import file ===")
for i in issues:
    print('category:', i.get('category'), '| title:', i.get('title'), '| evidence:', i.get('evidence',''))

print()
code_b = 'def get_user(db, user_id):\n    query = "SELECT * FROM users WHERE id=" + user_id\n    return db.execute(query)'
from ai_engine.analyzers.security_analyzer import SecurityAnalyzer
sa = SecurityAnalyzer()
issues_b = sa.analyze('b.py', 'python', code_b)
print("=== Analyzer output for SQL injection file ===")
for i in issues_b:
    print('category:', i.get('category'), '| title:', i.get('title'), '| evidence:', i.get('evidence',''))
