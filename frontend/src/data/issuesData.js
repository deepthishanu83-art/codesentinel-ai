/**
 * Mock Data Service for CodeSentinel AI Issues & Vulnerabilities.
 * Designed so real REST/GraphQL APIs can easily replace mock data calls.
 */

export const MOCK_ISSUES = [
  {
    id: 'SEC-402',
    title: 'SQL Injection in Auth Pipeline',
    severity: 'Critical',
    severityColor: 'bg-red-500/10 text-red-400 border-red-500/20',
    type: 'Security Risk',
    file: 'auth.py',
    line: 42,
    repo: 'ecommerce-api',
    status: 'Open',
    whyProblem:
      'User inputs from direct request queries are concatenated directly into raw SQL string executions without parameter binding. This allows unauthenticated attackers to bypass authentication or execute arbitrary database commands.',
    vulnerableCode: `def get_user_by_email(email_input):\n    # VULNERABLE: Direct string interpolation into raw query\n    query = f"SELECT * FROM users WHERE email = '{email_input}' AND active = 1"\n    cursor.execute(query)\n    return cursor.fetchone()`,
    aiRecommendedFix: `def get_user_by_email(email_input):\n    # FIX: Use parameterized query binding to neutralize SQL injection\n    query = "SELECT * FROM users WHERE email = %s AND active = 1"\n    cursor.execute(query, (email_input,))\n    return cursor.fetchone()`,
    diff: [
      { type: 'context', line: 'def get_user_by_email(email_input):' },
      { type: 'removed', line: '    query = f"SELECT * FROM users WHERE email = \'{email_input}\' AND active = 1"' },
      { type: 'added', line: '    # FIX: Use parameterized query binding to neutralize SQL injection' },
      { type: 'added', line: '    query = "SELECT * FROM users WHERE email = %s AND active = 1"' },
      { type: 'removed', line: '    cursor.execute(query)' },
      { type: 'added', line: '    cursor.execute(query, (email_input,))' },
      { type: 'context', line: '    return cursor.fetchone()' },
    ],
    validation: {
      syntaxCheck: { status: 'passed', label: 'Syntax check passed' },
      tests: { status: 'passed', label: 'Unit & Auth integration tests passing (14/14)' },
      securityScan: { status: 'passed', label: 'SAST re-scan verified 0 SQLi vectors' },
    },
  },
  {
    id: 'DEP-108',
    title: 'Outdated jsonwebtoken package (CVE-2023-45857)',
    severity: 'High',
    severityColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    type: 'Vulnerability',
    file: 'package.json',
    line: 18,
    repo: 'ecommerce-api',
    status: 'Pending',
    whyProblem:
      'jsonwebtoken version 8.5.1 is vulnerable to key confusion algorithms when parsing HMAC signed tokens, potentially allowing signature spoofing.',
    vulnerableCode: `"dependencies": {\n  "jsonwebtoken": "^8.5.1",\n  "express": "^4.18.2"\n}`,
    aiRecommendedFix: `"dependencies": {\n  "jsonwebtoken": "^9.0.2",\n  "express": "^4.18.2"\n}`,
    diff: [
      { type: 'removed', line: '  "jsonwebtoken": "^8.5.1",' },
      { type: 'added', line: '  "jsonwebtoken": "^9.0.2",' },
    ],
    validation: {
      syntaxCheck: { status: 'passed', label: 'npm lockfile validation passed' },
      tests: { status: 'passed', label: 'JWT token signing test suite passed' },
      securityScan: { status: 'passed', label: 'Dependency vulnerability remediated' },
    },
  },
  {
    id: 'QUAL-089',
    title: 'Unhandled Promise Rejection in Payment Webhook',
    severity: 'Medium',
    severityColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    type: 'Code Quality',
    file: 'src/api/webhooks.ts',
    line: 88,
    repo: 'ecommerce-api',
    status: 'In Review',
    whyProblem:
      'Async webhook handlers lack try/catch blocks, leading to unhandled node process rejections and memory leaks during stripe network timeouts.',
    vulnerableCode: `export async function handleStripeWebhook(req, res) {\n  const event = stripe.webhooks.constructEvent(req.body, sig, secret);\n  await processPayment(event.data.object);\n  res.json({ received: true });\n}`,
    aiRecommendedFix: `export async function handleStripeWebhook(req, res) {\n  try {\n    const event = stripe.webhooks.constructEvent(req.body, sig, secret);\n    await processPayment(event.data.object);\n    return res.json({ received: true });\n  } catch (err) {\n    logger.error('Webhook processing failed', err);\n    return res.status(400).send(\`Webhook Error: \${err.message}\`);\n  }\n}`,
    diff: [
      { type: 'context', line: 'export async function handleStripeWebhook(req, res) {' },
      { type: 'added', line: '  try {' },
      { type: 'context', line: '    const event = stripe.webhooks.constructEvent(req.body, sig, secret);' },
      { type: 'context', line: '    await processPayment(event.data.object);' },
      { type: 'removed', line: '  res.json({ received: true });' },
      { type: 'added', line: '    return res.json({ received: true });' },
      { type: 'added', line: '  } catch (err) {' },
      { type: 'added', line: '    logger.error(\'Webhook processing failed\', err);' },
      { type: 'added', line: '    return res.status(400).send(`Webhook Error: ${err.message}`);' },
      { type: 'added', line: '  }' },
      { type: 'context', line: '}' },
    ],
    validation: {
      syntaxCheck: { status: 'passed', label: 'TypeScript compilation cleanly passed' },
      tests: { status: 'passed', label: 'Webhook error handling suite passed (8/8)' },
      securityScan: { status: 'passed', label: 'No exception leakage detected' },
    },
  },
]

export function getIssueById(id) {
  return MOCK_ISSUES.find((issue) => issue.id === id) || MOCK_ISSUES[0]
}
