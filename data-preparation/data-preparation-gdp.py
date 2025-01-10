import pandas as pd

file_path = "./datasets/gdp/GDP-per_capita-Dataset-euro.csv"
df = pd.read_csv(file_path)

df.loc[df['Country'] == 'Macedonia, FYR', 'Country'] = 'North Macedonia'
df.loc[df['Country'] == 'Russia', 'Country'] = 'Russian Federation'
df.loc[df['Country'] == 'Slovak Republic', 'Country'] = 'Slovakia'
df.loc[df['Country'] == 'Czech Republic', 'Country'] = 'Czechia'

output_path = "./datasets/gdp/GDP-per_capita-Dataset-euro.csv"
df.to_csv(output_path, index=False)

print(f"Updated file saved to {output_path}")

'''
# Load the data from a CSV file
df = pd.read_csv('./datasets/gdp/GDP-per_capita-Dataset.csv')

df.rename(columns={
    'Income per person (ppp$2021)': 'Income_per_Person',
    'GDP total': 'Total_GDP',
    'GDP per capita growth (%)': 'GDP_per_Capita_Growth_(%)'
}, inplace=True)

df['Income_per_Person'] = pd.to_numeric(df['Income_per_Person'], errors='coerce')
df['Total_GDP'] = pd.to_numeric(df['Total_GDP'], errors='coerce')

usd_to_eur_rate = 0.97

df['Income_per_Person'] = df['Income_per_Person'] * usd_to_eur_rate
df['Total_GDP'] = df['Total_GDP'] * usd_to_eur_rate

df.fillna(0, inplace=True)

print(df)

df.to_csv('./datasets/gdp/GDP-per_capita-Dataset-euro.csv', index=False)
'''