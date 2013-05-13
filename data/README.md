This Directory contains all the data used in my project. Note some folders and files only appear after the generation or training steps take place.

Directories
===========
 * **raw\_data:** source code that is used to generate everything in function_data.
   * All of the files are Jacob Friesen's code except jQuery, Underscore and Chai.
   * Their respective licenses can be found in node\_modules.
 * **merged\_data:** source code with my function merge always applied, here so I can evaluate them later.
 * **nueral\_networks:** Each network that was generated in training has its weights and layers saved to a file in here.
 * **function\_data:** Contains information on the functions derived from raw\_data.
   * **merge\_data.json:** Statistics of each function merge with the name of the merge.
   * **valid\_merges.json:** Merge names mapped to whether their merge is valid or not (handcoded currently).
   * **combined.json:** Merge of the valid merges into merge data.

