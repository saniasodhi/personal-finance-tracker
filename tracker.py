# tracker.py — Day 1 minimal CLI
import argparse
from pathlib import Path
import pandas as pd
from dateutil.parser import parse

DATA_DIR = Path("data")
DATA_DIR.mkdir(parents=True, exist_ok=True)
STORE = DATA_DIR / "transactions.csv"

COLUMNS = ["date", "description", "category", "amount", "payment_method"]

def ensure_store():
    if not STORE.exists():
        pd.DataFrame(columns=COLUMNS).to_csv(STORE, index=False)

def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.rename(columns={c: c.lower().strip() for c in df.columns})
    for col in COLUMNS:
        if col not in df.columns:
            df[col] = pd.NA
    df = df[COLUMNS]
    df["date"] = pd.to_datetime(df["date"], errors="coerce").dt.date
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)
    return df

def load_store() -> pd.DataFrame:
    ensure_store()
    df = pd.read_csv(STORE)
    if not df.empty:
        df["date"] = pd.to_datetime(df["date"]).dt.date
    return df

def import_file(path: str):
    ensure_store()
    if path.lower().endswith((".xlsx", ".xls")):
        df = pd.read_excel(path)
    else:
        df = pd.read_csv(path)
    df = normalize_columns(df)
    existing = load_store()
    out = pd.concat([existing, df], ignore_index=True)
    out.to_csv(STORE, index=False)
    print(f"✅ Imported {len(df)} rows into {STORE}")

def add_expense(date, description, category, amount, payment_method="UPI"):
    ensure_store()
    # light validation
    dt = parse(str(date)).date()
    amt = float(amount)
    row = pd.DataFrame([{
        "date": dt,
        "description": description,
        "category": category,
        "amount": amt,
        "payment_method": payment_method
    }])
    out = pd.concat([load_store(), row], ignore_index=True)
    out.to_csv(STORE, index=False)
    print("✅ Saved:", row.iloc[0].to_dict())

def show_tail(n=20):
    df = load_store()
    if df.empty:
        print("No transactions yet.")
    else:
        print(df.tail(n).to_string(index=False))

def main():
    p = argparse.ArgumentParser(prog="tracker", description="Day 1: CSV/Excel import + add + show")
    sub = p.add_subparsers(dest="cmd", required=True)

    s_imp = sub.add_parser("import", help="Import CSV/Excel file")
    s_imp.add_argument("path")

    s_add = sub.add_parser("add", help="Add one expense")
    s_add.add_argument("--date", required=True, help="YYYY-MM-DD")
    s_add.add_argument("--desc", required=True)
    s_add.add_argument("--cat", required=True)
    s_add.add_argument("--amount", required=True, type=float)
    s_add.add_argument("--pay", default="UPI")

    s_show = sub.add_parser("show", help="Show last N transactions")
    s_show.add_argument("-n", type=int, default=20)

    args = p.parse_args()
    if args.cmd == "import":
        import_file(args.path)
    elif args.cmd == "add":
        add_expense(args.date, args.desc, args.cat, args.amount, args.pay)
    elif args.cmd == "show":
        show_tail(args.n)

if __name__ == "__main__":
    main()
