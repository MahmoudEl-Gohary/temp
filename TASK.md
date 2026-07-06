1. walk through the data dir in it you will find 2 sub folder 1. spine 2. knee in each folder you will find first a radeval_detailed_long.csv in this folder you will find the following score id,model,bleu,rouge1,rouge2,rougeL,bertscore,radeval_bertscore,ratescore,temporal_f1 for 5 models base_qwen, medgemma, zc, rology, zc_rology same for spine and knee after this you will find a folder named green it has files that has detailed scoring for each model you will find a file for each model and a summar file the sammery header is id,base_qwen_green,medgemma_green,zc_only_green,rology_only_green,zc_rology_green and for each file deatiled for each model these are the headers id,reference,predictions,green_analysis,green_score,(a) False report of a finding in the candidate,(b) Missing a finding present in the reference,(c) Misidentification of a finding's anatomic location/position,(d) Misassessment of the severity of a finding,(e) Mentioning a comparison that isn't in the reference,(f) Omitting a comparison detailing a change from a prior study,Matched Findings same for the spine and knee last there is the reports/data.csv that has the ground and genrated reports for each model id,ground_report,base_qwen,medgemma,zc_only,rology_only,zc_rology

2. after getting familur with the data i want you to create an interactive dashboard rather tan generating tound of figures. i will wak you through what i need. first i need to it to be easy toswitch between spine and knee to there should be a switch button to switch between spine and knee and the whole dashboard should update accordingly. also the charts should be switchable rather than all in one page and cannot have a good look at them.

3. for the charts i need you to study the data and make the best charts for us to make insights for them but i need to be able to switch between the model for each chart and the data should be upadated rather than chart for each model also the i need to swithch between score in each one rather than a chart per score.

4. for the design i need it to be simple and modern i need it elegant you decide the best frameworks and technologies and i will install what ever you need 

5. i attached an example of a chart bet feel free to ignore it 


---

1. i need it to be a light mood not dark
2. in the scatter plot i need to 1. choose the metcies for each axis 2. choose the samples to be displayed like worest 50 samples on a certin score beacuse it is too crowded 
3. in the GREEN Errors section i need the panel for the model and metric to be hidden as there is no use for it 
4. the diff highlighting is not working well the right is all always green and the left is all always red