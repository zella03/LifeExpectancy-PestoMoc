import pandas as pd

input_file = './datasets/gdp/GDP-per_capita-Dataset-euro.csv'
data = pd.read_csv(input_file)



filtered_data = data[['Country', 'Year', 'Income_per_Person', 'Total_GDP']]

for year in range(2000, 2022):
    yearly_data = filtered_data[filtered_data['Year'] == year]

    healthcare_file = f'./datasets/healthcare/with-life-expectancy-by-years/life-expectancy-health-expenditure-{year}.csv'
    healthcare_data = pd.read_csv(healthcare_file)

    merged_data = pd.merge(yearly_data, healthcare_data, on=['Country', 'Year'])


    output_file = f'./datasets/gdp/with-healthcare-by-years/gdp-healthcare-{year}.csv'
    merged_data.to_csv(output_file, index=False)
