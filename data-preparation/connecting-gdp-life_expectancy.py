import pandas as pd

gdp_df = pd.read_csv('./datasets/gdp/GDP-per_capita-Dataset-euro.csv')
life_df = pd.read_csv('./datasets/life-expectancy-population/EU-life-expectancy-population-(1960-2023).csv')

merged_df = pd.merge(gdp_df, life_df, on=['Country', 'Year'], how='inner')

print(merged_df.head())

merged_df.to_csv('./datasets/gdp/merged-gdp-life_expectancy.csv', index=False)