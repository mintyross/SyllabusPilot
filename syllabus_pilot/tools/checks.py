def check_items(items: list[dict]) -> dict:
    """Validates extracted syllabus items for weight total, missing dates, and duplicates.

    Shared shape expected:
      item = {"name": str, "type": str, "due_date": str or None, "weight": float}
    """
    if not items:
        return {
            "valid": False,
            "total_weight": 0.0,
            "warnings": ["No graded items were found."],
            "summary": "No graded items found.",
        }

    total_weight = 0.0
    missing_dates = []
    seen_names = set()
    duplicates = set()

    for item in items:
        name = item.get("name", "Unnamed Item")
        weight = float(item.get("weight", 0))
        due_date = item.get("due_date")

        total_weight += weight

        if not due_date:
            missing_dates.append(name)

        if name in seen_names:
            duplicates.add(name)
        seen_names.add(name)

    warnings = []
    if abs(total_weight - 100.0) > 0.5:
        warnings.append(f"Grading weights sum to {total_weight:.1f}%, not 100%.")

    if missing_dates:
        warnings.append(f"Missing specific due dates for: {', '.join(missing_dates)}.")

    if duplicates:
        warnings.append(f"Duplicate item names found: {', '.join(duplicates)}.")

    summary = f"Found {len(items)} items totaling {total_weight:.1f}%."
    if warnings:
        summary += f" ({len(warnings)} warning(s): {'; '.join(warnings)})"

    return {
        "valid": len(warnings) == 0,
        "total_weight": round(total_weight, 2),
        "item_count": len(items),
        "warnings": warnings,
        "summary": summary,
    }
