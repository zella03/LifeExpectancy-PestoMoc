import pandas as pd

# function to classify series name - life expectancy or population data
def classify_series(series_name):
    if pd.isna(series_name):
        return None, None
    elif "Life expectancy" in series_name:
        return "Life_expectancy", series_name.split(",")[-1].strip()
    elif "Population" in series_name:
        return "Population", series_name.split(",")[-1].strip()
    
    return None, None

# loading life-expectancy and population data
file_path = 'datasets/life-expectancy-population/EU-life-expectancy-population-(1960-2023)-wide.csv'
df = pd.read_csv(file_path)

# convering from wide to long format
df_long = pd.melt(
    df,
    id_vars=["Country Name", "Country Code", "Series Name", "Series Code"],
    var_name="Year",
    value_name="Value"
)

# extract 4-digit year and convert to integer
df_long["Year"] = df_long["Year"].str.extract(r"(\d{4})").astype("Int64")
df_long["Value"] = pd.to_numeric(df_long["Value"], errors="coerce") # change non numeric values to NaN

# data summary
print(df_long.info())
print(df_long.head())
# print(df_long.describe())
print("Unique Countries:", df_long["Country Name"].nunique())
print("Year Range:", df_long['Year'].min(), "-", df_long['Year'].max())
print("Missing Values per Column:")
print(df_long.isnull().sum())
print(df_long["Series Name"].unique())


# dropping missing values
df_long = df_long.dropna(subset=["Value", "Year"])

# filter countries with no missing values
valid_countries = df_long.groupby("Country Name")["Value"].transform("count") > 0
df_long = df_long[valid_countries]

# by series name extract the type of series and 
# whether it applies to male, female or total values
df_long[["Type", "Total"]] = df_long["Series Name"].apply(
    lambda x: pd.Series(classify_series(x))
)

# remove missing values
df_long = df_long.dropna(subset=["Type", "Total"])

# drop duplicates of data
df_long = df_long.drop_duplicates(subset=["Country Name", "Year", "Type", "Total"])

# convert type (Life Expectancy, Population) into separate columns 
# from long to wide
result = df_long.pivot_table(
    index=["Country Name", "Year", "Total"],
    columns="Type",
    values="Value",
    aggfunc="first"
).reset_index() # preserve index as columns names

result.columns.name = None
result.rename(columns={"Country Name": "Country"}, inplace=True)

# save data about each year to separate files
unique_years = result['Year'].unique()
for year in unique_years:
    # we dont have all data for 2023
    if year != 2023:
        yearly_data = result[result['Year'] == year]
        output_file = f"datasets/life-expectancy-population/by-years/life-expectancy-population-{year}.csv"
        yearly_data.to_csv(output_file, index=False)

# for andora, mocano, san marino we dont have life-expectancy
# save processed data, used to join other datasets
output_file_path = 'datasets/life-expectancy-population/EU-life-expectancy-population-(1960-2023).csv'
result.to_csv(output_file_path, index=False)



