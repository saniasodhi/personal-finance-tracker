import argparse
from pathlib import Path
import pandas as pd
from dateutil.parser import parse
from categorize import auto_categorize

# --------------------------
# Setup
# --------------------------
DATA_DIR = Path("data")
DATA_DIR.mkdir(parents=True, exist_ok=True)
STORE = DATA_DIR / "transactions.csv"

COLUMNS = ["date", "category", "description", "money_spent", "money_left", "payment_method"]

# --------------------------
# Helpers
# --------------------------
def ensure_store():
    """Make sure transactions.csv exists, otherwise create it empty."""
    if not STORE.exists():
        pd.DataFrame(columns=COLUMNS).to_csv(STORE, index=False)

def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Clean up imported CSV/Excel to match our schema (and map legacy 'amount')."""
    # lowercase headers
    df = df.rename(columns={c: c.lower().strip() for c in df.columns})

    # map legacy column 'amount' -> 'money_spent' if needed
    if "money_spent" not in df.columns and "amount" in df.columns:
        df["money_spent"] = df["amount"]

    # ensure all required columns exist
    COLUMNS = ["date", "category", "description", "money_spent", "money_left", "payment_method"]
    for col in COLUMNS:
        if col not in df.columns:
            df[col] = pd.NA

    # type fixes
    df["date"] = pd.to_datetime(df["date"], errors="coerce").dt.date
    df["money_spent"] = pd.to_numeric(df["money_spent"], errors="coerce").fillna(0.0)
    df["money_left"]  = pd.to_numeric(df["money_left"],  errors="coerce")
    df["payment_method"] = "UPI"  # your use-case

    # keep only the official columns (drops stray 'amount', etc.)
    df = df[["date", "category", "description", "money_spent", "money_left", "payment_method"]]
    return df


def load_store() -> pd.DataFrame:
    """Load transactions.csv into a DataFrame."""
    ensure_store()
    df = pd.read_csv(STORE)
    if not df.empty:
        df["date"] = pd.to_datetime(df["date"]).dt.date
    return df

def last_balance() -> float | None:
    """Return the most recent money_left, or None if no rows yet."""
    df = load_store()
    if df.empty:
        return None
    try:
        val = float(df.iloc[-1]["money_left"])
        return val
    except Exception:
        return None

# --------------------------
# Core functions
# --------------------------
def import_file(path: str):
    """Import a CSV or Excel file and append to store (auto-categorized)."""
    ensure_store()
    if path.lower().endswith((".xlsx", ".xls")):
        df = pd.read_excel(path)
    else:
        df = pd.read_csv(path)
    df = normalize_columns(df)
    # NEW: auto-categorize incoming rows
    df = auto_categorize(df)

    existing = load_store()
    out = pd.concat([existing, df], ignore_index=True)
    out = auto_categorize(out)  # ensure entire store stays consistent
    out.to_csv(STORE, index=False)
    print(f"✅ Imported {len(df)} rows into {STORE} (auto-categorized)")


def add_expense(date, category, description, money_spent, money_left=None, start_balance=None):
    """
    Add a single expense row (UPI only), auto-filling:
      - money_left (from last balance or --start)
      - category (from description) if you pass category="-"
    """
    ensure_store()
    dt = parse(str(date)).date()
    spent = float(money_spent)

    # Determine base balance to subtract from (explicit --start wins)
    base = None
    if start_balance is not None:
        base = float(start_balance)
    else:
        base = last_balance()  # may be None if no rows yet
        if base is None and money_left is None:
            raise SystemExit("❌ First entry needs --start <starting_balance> or provide --left explicitly.")


    # Auto-compute money_left if not provided
    if money_left is None:
        money_left = (base - spent) if base is not None else None
    left = float(money_left)

    # Build row (category may be "-" to request auto-categorization)
    row = pd.DataFrame([{
        "date": dt,
        "category": category,
        "description": description,
        "money_spent": spent,
        "money_left": left,
        "payment_method": "UPI"
    }])

    # Append and then auto-categorize the combined store
    out = pd.concat([load_store(), row], ignore_index=True)
    out = auto_categorize(out)
    out.to_csv(STORE, index=False)
    print("✅ Saved (auto-categorized):", row.iloc[0].to_dict())


def show_tail(n=20, month=None):
    df = load_store()
    if df.empty:
        print("No transactions yet.")
        return
    if month:
        df = df[df["date"].astype(str).str.startswith(month)]
    print(df.tail(n).to_string(index=False))


def add_income(date, description, amount, start_balance=None):
    """
    Add an income row (money added to balance).
    Stored as a negative money_spent, so balance increases.
    """
    ensure_store()
    dt = parse(str(date)).date()
    amt = float(amount)

    # Determine base balance
    base = None
    if start_balance is not None:
        base = float(start_balance)
    else:
        base = last_balance() or 0.0

    new_balance = base + amt

    row = pd.DataFrame([{
        "date": dt,
        "category": "Income",
        "description": description,
        "money_spent": -amt,   # negative = income
        "money_left": new_balance,
        "payment_method": "UPI"
    }])

    out = pd.concat([load_store(), row], ignore_index=True)
    out = auto_categorize(out)
    out.to_csv(STORE, index=False)
    print("✅ Income added:", row.iloc[0].to_dict())

# --------------------------
# CLI
# --------------------------
def main():
    p = argparse.ArgumentParser(
        prog="tracker",
        description="Day 1: Import CSV/Excel + Add expense (auto money_left) + Show recent"
    )
    sub = p.add_subparsers(dest="cmd", required=True)

    # import
    s_imp = sub.add_parser("import", help="Import a CSV/Excel file into the store")
    s_imp.add_argument("path")

    # add
    s_add = sub.add_parser("add", help="Add one expense (UPI only)")
    s_add.add_argument("--date", required=True, help="YYYY-MM-DD")
    s_add.add_argument("--cat",  required=True, help="Category")
    s_add.add_argument("--desc", required=True, help="Description")
    s_add.add_argument("--spent", required=True, type=float, help="Money spent")

    # Optional: either give --left to set manually OR give --start for the very first entry
    s_add.add_argument("--left",  type=float, help="Money left after spending (optional, auto if omitted)")
    s_add.add_argument("--start", type=float, help="Starting balance (only needed for your first entry)")

    # show
    s_show = sub.add_parser("show", help="Show last N transactions")
    s_show.add_argument("-n", type=int, default=20)
    s_show.add_argument("--month", help="Filter by YYYY-MM (e.g., 2025-09)")


    # ---- categorize ----
    s_cat = sub.add_parser("categorize", help="Auto-categorize and save file")

    # ---- summary ----
    s_sum = sub.add_parser("summary", help="Show total spend by category")
    s_sum.add_argument("--top", type=int, default=10)
    s_sum.add_argument("--month", help="Filter by YYYY-MM (e.g., 2025-09)")


    # income
    s_inc = sub.add_parser("income", help="Add money (increase balance)")
    s_inc.add_argument("--date", required=True, help="YYYY-MM-DD")
    s_inc.add_argument("--desc", required=True, help="Description (e.g., Pocket Money)")
    s_inc.add_argument("--amount", required=True, type=float, help="Amount added")
    s_inc.add_argument("--start", type=float, help="Starting balance (only for first row)")

    args = p.parse_args()
    if args.cmd == "import":
        import_file(args.path)

    elif args.cmd == "add":
        add_expense(
            date=args.date,
            category=args.cat,
            description=args.desc,
            money_spent=args.spent,
            money_left=args.left,
            start_balance=args.start
        )

    elif args.cmd == "income":
        add_income(
            date=args.date,
            description=args.desc,
            amount=args.amount,
            start_balance=args.start
        )


    elif args.cmd == "show":
        show_tail(args.n, args.month)


    elif args.cmd == "summary":
        df = load_store()
        if df.empty:
            print("No transactions yet.")
        else:
            if args.month:
                df = df[df["date"].astype(str).str.startswith(args.month)]
            df = auto_categorize(df)

            # Split income vs expense
            df["income"] = df["money_spent"].apply(lambda x: -x if x < 0 else 0)
            df["expense"] = df["money_spent"].apply(lambda x: x if x > 0 else 0)

            # Group by category
            grouped = df.groupby("category")[["income", "expense"]].sum().sort_values("expense", ascending=False)

            print("\n📊 Category Summary")
            print(grouped.to_string())

            # Net totals
            total_income = df["income"].sum()
            total_expense = df["expense"].sum()
            net = total_income - total_expense

            print("\n Totals")
            print(f"Total Income : {total_income}")
            print(f"Total Expense: {total_expense}")
            print(f"Net Balance  : {net}")


    elif args.cmd == "categorize":
        df = load_store()
        df2 = auto_categorize(df)
        df2.to_csv(STORE, index=False)
        print("✅ Auto-categorized and saved to", STORE)

    elif args.cmd == "summary":
        df = load_store()
        if df.empty:
            print("No transactions yet.")
        else:
            df = auto_categorize(df)
            totals = df.groupby("category")["money_spent"].sum().sort_values(ascending=False)
            print(totals.head(args.top).to_string())

    elif args.cmd == "income":
        add_income(
            date=args.date,
            description=args.desc,
            amount=args.amount,
            start_balance=args.start
        )

if __name__ == "__main__":
    main()
