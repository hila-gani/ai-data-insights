import pandas as pd

def get_data_summary(df: pd.DataFrame) -> str:
    meta_info = f"Dataset size: {df.shape[0]} rows, {df.shape[1]} columns."
    stats_summary = df.describe(include='all').to_string()
    sample_data = df.head(3).to_string()
    columns_info = df.dtypes.to_string()

    return f"""
    --- DATA OVERVIEW ---
    {meta_info}
    
    --- COLUMN TYPES ---
    {columns_info}
    
    --- DESCRIPTIVE STATISTICS ---
    {stats_summary}
    
    --- SAMPLE ROWS ---
    {sample_data}
    """