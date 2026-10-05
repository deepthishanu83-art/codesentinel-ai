import difflib
from typing import Dict, Any, Optional, Tuple


class PatchGenerator:
    """
    Generates unified diff patches between original and remediated code,
    calculating line additions, deletions, and changed ranges.
    Does NOT modify the file system or repository directly.
    """

    @staticmethod
    def generate_diff(
        original_code: str,
        fixed_code: str,
        file_path: str = "app.py"
    ) -> str:
        """
        Generate a standard Git-compatible unified diff string.
        """
        orig_lines = [l if l.endswith("\n") else l + "\n" for l in original_code.splitlines()]
        fixed_lines = [l if l.endswith("\n") else l + "\n" for l in fixed_code.splitlines()]

        diff = difflib.unified_diff(
            orig_lines,
            fixed_lines,
            fromfile=f"a/{file_path}",
            tofile=f"b/{file_path}",
            lineterm="\n"
        )
        return "".join(diff)

    @classmethod
    def create_patch(
        cls,
        original_code: str,
        fixed_code: str,
        file_path: str = "app.py"
    ) -> Dict[str, Any]:
        """
        Create a structured patch object with diff and statistics.
        """
        diff_text = cls.generate_diff(original_code, fixed_code, file_path)

        additions = 0
        deletions = 0

        for line in diff_text.splitlines():
            if line.startswith("+") and not line.startswith("+++"):
                additions += 1
            elif line.startswith("-") and not line.startswith("---"):
                deletions += 1

        return {
            "file": file_path,
            "diff": diff_text,
            "additions": additions,
            "deletions": deletions,
            "total_changes": additions + deletions,
            "is_empty": (additions == 0 and deletions == 0)
        }

    @staticmethod
    def apply_snippet_replacement(
        full_code: str,
        target_snippet: str,
        replacement_snippet: str
    ) -> Tuple[str, bool]:
        """
        Replace target snippet within full_code safely.
        Returns (new_full_code, success_flag).
        """
        if target_snippet in full_code:
            new_code = full_code.replace(target_snippet, replacement_snippet, 1)
            return (new_code, True)

        # Try stripped line-by-line matching
        target_lines = [l.strip() for l in target_snippet.splitlines() if l.strip()]
        if not target_lines:
            return (full_code, False)

        code_lines = full_code.splitlines()
        first_target = target_lines[0]

        for idx, line in enumerate(code_lines):
            if first_target in line:
                # Replace matching line(s)
                code_lines[idx] = replacement_snippet
                return ("\n".join(code_lines), True)

        return (full_code, False)
