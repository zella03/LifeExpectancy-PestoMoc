import pandas as pd
import numpy as np

# loading health expenditure data
health_exp_file = 'datasets/healthcare/healthcare-expenditure-per-capita.txt' 
health_df = pd.read_csv(health_exp_file, on_bad_lines='skip')

# change data format from wide to long format
health_long = pd.melt(
    health_df,
    id_vars=["Country Name", "Country Code", "Indicator Name", "Indicator Code"],
    var_name="Year",
    value_name="Health Expenditure"
)

# extract 4-digit year and convert to integer
health_long["Year"] = health_long["Year"].str.extract(r"(\d{4})").astype("Int64")

# data summary
print(health_long.info())
print(health_long.head())
#print(health_long.describe()) # explore health expenditures per capita
print("Unique Countries:", health_long["Country Name"].nunique())
print("Year Range:", health_long['Year'].min(), "-", health_long['Year'].max())
print("Missing Values per Column:")
print(health_long.isnull().sum())

# remove missing values from 'Health Expenditure' and 'Year'
health_long = health_long[~np.isnan(health_long["Health Expenditure"])]
health_long = health_long[~np.isnan(health_long["Year"])]

# convert currency of expenditures from USD to EUR
usd_to_eur_rate = 0.85
health_long.rename(columns={"Health Expenditure": "Health Expenditure per Capita"}, inplace=True)
health_long = health_long[["Country Name", "Year", "Health Expenditure per Capita"]]
health_long["Health Expenditure per Capita"] = np.multiply(health_long["Health Expenditure per Capita"], usd_to_eur_rate)

print("Health expenditures per capita in EUR")
print(health_long["Health Expenditure per Capita"].describe()) # explore health expenditures in EUR

# loading and merging life-expectancy&population data for each year
unique_years = health_long['Year'].unique()
for year in unique_years:
    life_exp_file = f"datasets/life-expectancy-population/by-years/life-expectancy-population-{year}.csv"
    life_exp_df = pd.read_csv(life_exp_file)

    combined_df = pd.merge(
        life_exp_df,
        health_long,
        how="inner",
        left_on=["Country", "Year"],
        right_on=["Country Name", "Year"]
    )

    combined_df = combined_df[combined_df['Total'] == 'total']
    combined_df = combined_df.drop(columns=["Country Name", "Total"])

    # calculating total health expenditure based on per capita and population data
    combined_df["Total Health Expenditure"] = np.multiply(
        combined_df["Health Expenditure per Capita"], combined_df["Population"]
    )

    # filter only data for given 
    yearly_data = combined_df[combined_df['Year'] == year]

    # save each year to separate file
    output_file = f"datasets/healthcare/with-life-expectancy-by-years/life-expectancy-health-expenditure-{year}.csv"
    yearly_data.to_csv(output_file, index=False)
