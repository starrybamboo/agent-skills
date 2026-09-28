# When to Mock

Choose real dependencies or test doubles according to the behavior being checked, reproducibility, execution cost, and safe isolation. Reuse existing fixtures and test tools where they fit.

- Keep doubles faithful to the behavior relevant to the assertion; a test that only proves its own mock configuration adds no evidence.
- When replacing a dependency hides the integration behavior under investigation, use a check that actually exercises that behavior.
- Keep test effects confined to authorized test resources, especially for payments, messages, and persistent data.

Use dependency injection or other existing substitution mechanisms when helpful. Test setup does not by itself justify redesigning production interfaces.
