# categorize.py — rules for auto-categorizing expenses
import re
import pandas as pd

CATEGORY_RULES = {
    "Food":       [r"starbucks|cafe|restaurant|swiggy|zomato|pizza|maggie|coffee|burger"],
    "Transport":  [r"uber|ola|metro|bus|train|cab|taxi|auto|fuel|petrol|diesel"],
    "Shopping":   [r"amazon|flipkart|myntra|nykaa|zara|h&m|mall|store|earphones|clothes"],
    "Housing":    [r"rent|pg|maintenance|electricity|water bill|gas bill|wifi|broadband"],
    "Health":     [r"pharmacy|chemist|doctor|hospital|clinic|medicine|gym"],
    "Pleasure":   [r"movie|cinema|netflix|spotify|prime|gaming|ps|steam"],
    "Other":      [r".*"]  # fallback
}

def auto_categorize(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    df = df.copy()
    df["description"] = df["description"].astype(str).str.lower()

    def classify(desc, existing):
        if pd.notna(existing) and str(existing).strip():
            return existing  # keep existing
        for cat, patterns in CATEGORY_RULES.items():
            for pat in patterns:
                if re.search(pat, desc):
                    return cat
        return "Other"

    df["category"] = [classify(d, c) for d, c in zip(df["description"], df["category"])]
    return df
