def capitalize_words(value: str) -> str:
    """Capitalize the first letter of each word, leaving the rest lowercased."""
    return ' '.join(word.capitalize() for word in value.split())
