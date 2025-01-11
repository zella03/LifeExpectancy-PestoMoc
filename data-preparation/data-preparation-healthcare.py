import pandas as pd

health_exp_file = 'datasets/healthcare/healthcare-expenditure-per-capita.txt' 
health_df = pd.read_csv(health_exp_file, on_bad_lines='skip')


health_long = pd.melt(
    health_df,
    id_vars=["Country Name", "Country Code", "Indicator Name", "Indicator Code"],
    var_name="Year",
    value_name="Health Expenditure"
)


health_long["Year"] = health_long["Year"].str.extract(r"(\d{4})").astype(float).astype("Int64")
health_long = health_long.dropna(subset=["Health Expenditure", "Year"])

usd_to_eur_rate = 0.97

health_long.rename(columns={"Health Expenditure": "Health Expenditure per Capita"}, inplace=True)
health_long = health_long[["Country Name", "Year", "Health Expenditure per Capita"]]
health_long["Health Expenditure per Capita"] = health_long["Health Expenditure per Capita"] * usd_to_eur_rate

# print(health_long)



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
    combined_df["Total Health Expenditure"] = combined_df["Health Expenditure per Capita"] * combined_df["Population"]

    yearly_data = combined_df[combined_df['Year'] == year]
    output_file = f"datasets/healthcare/with-life-expectancy-by-years/life-expectancy-health-expenditure-{year}.csv"
    yearly_data.to_csv(output_file, index=False)
