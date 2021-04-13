# libdat-survey-form
This is a survey form for book tags evaluation for the libdat project (Åbo Akademi). Tags table is algorithm genereted. The survey can be tested from (http://recommendabook.me:3030/). This is write once and forget type of project. 

# table tags format
- title,varchar(50),NO,,NULL
- tag,varchar(50),NO,,NULL
- score,varchar(50),NO,,NULL

# table surveyresponse format
- entryID,int,NO,PRI,NULL,auto_increment
- name_or_turkid,varchar(200),YES,,NULL
- title,varchar(200),YES,,NULL
- tag,varchar(200),NO,,NULL
- score,int,NO,,NULL
- response_time,timestamp,YES,,CURRENT_TIMESTAMP,"DEFAULT_GENERATED on update CURRENT_TIMESTAMP"

# Project setup
```
npm install
```

# Project run
```
npm run
```
