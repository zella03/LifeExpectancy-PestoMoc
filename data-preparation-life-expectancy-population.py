import pandas as pd
import numpy as np

file_path = 'datasets/life-expectancy-population/EU-life-expectancy-population-(1960-2023)-wide.csv'
df = pd.read_csv(file_path)

df_long = pd.melt(
    df,
    id_vars=["Country Name", "Country Code", "Series Name", "Series Code"],
    var_name="Year",
    value_name="Value"
)

df_long["Year"] = df_long["Year"].str.extract(r"(\d{4})").astype(float).astype("Int64")
df_long = df_long.dropna(subset=["Value", "Year"])
df_long["Value"] = pd.to_numeric(df_long["Value"], errors="coerce")
valid_countries = df_long.groupby("Country Name")["Value"].transform("count") > 0
df_long = df_long[valid_countries]

def classify_series(series_name):
    if pd.isna(series_name):
        return None, None
    elif "Life expectancy" in series_name:
        return "Life_expectancy", series_name.split(",")[-1].strip()
    elif "Population" in series_name:
        return "Population", series_name.split(",")[-1].strip()
    else:
        return None, None

df_long[["Type", "Total"]] = df_long["Series Name"].apply(
    lambda x: pd.Series(classify_series(x))
)

df_long = df_long.dropna(subset=["Type", "Total"])

def standardize_total(total):
    if 'female' in total:
        return 'female'
    elif 'male' in total:
        return 'male'
    elif 'total' in total:
        return 'total'
    else:
        return total

df_long["Total"] = df_long["Total"].apply(standardize_total)
df_long = df_long.drop_duplicates(subset=["Country Name", "Year", "Type", "Total"])

result = df_long.pivot_table(
    index=["Country Name", "Year", "Total"],
    columns="Type",
    values="Value",
    aggfunc="first"
).reset_index()

result.columns.name = None
result.rename(columns={"Country Name": "Country"}, inplace=True)

unique_years = result['Year'].unique()
for year in unique_years:
    # we dont have all data for 2023
    if year != 2023:
        yearly_data = result[result['Year'] == year]
        output_file = f"datasets/life-expectancy-population/by-years/life-expectancy-population-{year}.csv"
        yearly_data.to_csv(output_file, index=False)

# for andora mocano san marino we dont have life-expectancy
output_file_path = 'datasets/life-expectancy-population/EU-life-expectancy-population-(1960-2023).csv'
result.to_csv(output_file_path, index=False)

distinct_countries = result['Country'].unique()
print(distinct_countries)

