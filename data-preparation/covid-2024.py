import pandas as pd

df = pd.read_csv("datasets/covid/estimated-cumulative-excess-deaths-per-100000-people-during-covid-19.csv")

filtered_df = df[df['Day'] == '2024-02-15']

columns_to_keep = ['Entity', 'Day', 
                   'Cumulative excess deaths per 100,000 people (central estimate)', 
                   'Cumulative excess deaths per 100,000 people (95% CI, lower bound)', 
                   'Cumulative excess deaths per 100,000 people (95% CI, upper bound)', 
                   'Total confirmed deaths due to COVID-19 per 100,000 people']

filtered_df = filtered_df[columns_to_keep]

print(filtered_df)

filtered_df.to_csv("datasets/covid/covid-2024.csv", index=False)
