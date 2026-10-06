import json
from ai_engine.fix_engine.fix_generator import FixGenerator

generator = FixGenerator(llm_client=None)

print("\n--- TEST A ---")
code_a = '''import re\n\ndef hello():\n    return "hello"'''
res_a = generator._generate_deterministic_fallback_fix({'category': 'unused import', 'evidence': 'import re'}, code_a, 'python')
print('TEST A auto_fix:', res_a['auto_fix'])
print('TEST A fixed_code:\n' + res_a['fixed_code'])

print("\n--- TEST B ---")
code_b = '''def get_user(db, user_id):\n    query = "SELECT * FROM users WHERE id=" + user_id\n    return db.execute(query)'''
res_b = generator._generate_deterministic_fallback_fix({'category': 'sql injection', 'evidence': 'id='}, code_b, 'python')
print('TEST B auto_fix:', res_b['auto_fix'])
print('TEST B fixed_code:\n' + res_b['fixed_code'])

print("\n--- TEST C ---")
code_c = '''def add_item(item, items=[]):\n    items.append(item)\n    return items'''
res_c = generator._generate_deterministic_fallback_fix({'category': 'mutable default', 'evidence': 'items=[]'}, code_c, 'python')
print('TEST C auto_fix:', res_c['auto_fix'])
print('TEST C fixed_code:\n' + res_c['fixed_code'])
