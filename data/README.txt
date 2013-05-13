This Directory contains all the data used in my project.

-=Directories=-
raw_data: source code that is used to generate everything in function_data.
-All of the files are my code except jquery, underscore and chai.
-Their respective licenses can be found in node_modules.

merged_data: source code with my function merge always applied, here so I can evaluate them later.

nueral_networks: Each network that was generated in training has its weights and layers saved to a file in here.

function_data: Contains information on the functions derived from raw_data.
-merge_data.json: Atatistics of each function merge with the name of the merge.
-valid_merges.json: Merge names mapped to whether their merge is valid or not (handcoded).
-combined.json: Merge of the valid merges into merge data.

