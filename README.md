# Stack-Hoverflow

Demo: https://www.youtube.com/watch?v=nfiKWqHlJo4

The goal is to portray programming tools and languages as artifacts that evolve over time, with an emphasis on discovering the ways that these tools’ technological contributions and competition promote or hinder their growth. Although we aim to make this representation interesting from a narrative, story-telling standpoint where the user can see programming tools ‘warring’ for popularity, we also intend to develop an exploratory tool that enables users to see which programming languages suit their specific needs. Altogether, the most common and significant feedback from the poster session was to narrow down our target questions to these select use cases. From these comments we are now focusing expressly on the following two questions and their variations:

1. What can I use a specific language for?
2. Narrative: how do languages develop over time?

## DATA
The data dumps used for this project are officially provided by Stack Overflow

The original posts.xml file is the size of 36.2 GB and contains 26.5 million posts spanning from 2008 to 2015. We filtered out posts that do not have any tags associated with. After preprocessing, there remain 9,852,759 posts. Each post represents a question written by a user in the Stack Overflow website, and has the following attributes:

1. Date (July 31, 2008 to August 16, 2015)
2. List of tags
3. Score (# up votes - # down votes)
4. Number of answers
5. Number of views
6. Title text
7. User ID 

## Tech Stack

1. Python + Flask
2. AngularJS
3. D3.js
4. MySQL


