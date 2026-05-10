-- ==========================================
-- SEED DATA FOR DAILY CHALLENGE ARENA
-- ==========================================
-- Run this in your Supabase SQL Editor after running arena_schema.sql

INSERT INTO public.questions (topic, difficulty, question, options, correct_answer) VALUES
-- DSA (Data Structures & Algorithms)
('DSA', 'Medium', 'Which data structure is most efficiently used to implement a Priority Queue?', '["Array", "Linked List", "Binary Heap", "Hash Table"]', 'Binary Heap'),
('DSA', 'Medium', 'In a balanced binary search tree with N nodes, what is the time complexity to find the exact median value?', '["O(1)", "O(log N)", "O(N)", "O(N log N)"]', 'O(log N)'),
('DSA', 'Hard', 'What is the worst-case time complexity of the QuickSort algorithm, and how can it be mitigated?', '["O(N log N) using random pivot", "O(N^2) using median-of-three", "O(N^2) using a random pivot or median-of-three", "O(N log N) using the first element"]', 'O(N^2) using a random pivot or median-of-three'),
('DSA', 'Hard', 'Given a directed graph, which algorithm is best suited to detect a cycle?', '["BFS using a queue", "DFS using a recursion stack", "Dijkstra''s Algorithm", "Kruskal''s Algorithm"]', 'DFS using a recursion stack'),
('DSA', 'Medium', 'Which algorithmic paradigm is primarily used in finding the Longest Common Subsequence?', '["Greedy Algorithm", "Divide and Conquer", "Dynamic Programming", "Backtracking"]', 'Dynamic Programming'),

-- OOPS (Object-Oriented Programming)
('OOPS', 'Medium', 'Which concept allows a subclass to provide a specific implementation of a method that is already provided by its superclass?', '["Method Overloading", "Method Overriding", "Encapsulation", "Abstraction"]', 'Method Overriding'),
('OOPS', 'Hard', 'In languages like C++ or Java, what is the "Diamond Problem" associated with?', '["Multiple Inheritance", "Memory Leaks", "Multithreading Deadlocks", "Garbage Collection"]', 'Multiple Inheritance'),
('OOPS', 'Medium', 'Which design pattern restricts the instantiation of a class to exactly one object?', '["Factory Pattern", "Observer Pattern", "Singleton Pattern", "Decorator Pattern"]', 'Singleton Pattern'),
('OOPS', 'Hard', 'What is the principle of Liskov Substitution (SOLID)?', '["Objects should have multiple responsibilities", "Derived classes must be substitutable for their base classes", "Interfaces should be strictly segregrated", "Classes should depend on concrete implementations"]', 'Derived classes must be substitutable for their base classes'),
('OOPS', 'Medium', 'What does encapsulation primarily achieve in object-oriented programming?', '["Code reusability", "Data hiding and protection", "Runtime polymorphism", "Multiple inheritance"]', 'Data hiding and protection'),

-- OS (Operating Systems)
('OS', 'Medium', 'What is the primary purpose of a Translation Lookaside Buffer (TLB)?', '["To cache recent disk reads", "To cache virtual-to-physical address translations", "To manage CPU scheduling", "To handle hardware interrupts"]', 'To cache virtual-to-physical address translations'),
('OS', 'Hard', 'Which of the following conditions is NOT required for a deadlock to occur?', '["Mutual Exclusion", "Hold and Wait", "Preemption", "Circular Wait"]', 'Preemption'),
('OS', 'Medium', 'In the context of CPU scheduling, what does "Starvation" mean?', '["The CPU is completely idle", "A process is waiting indefinitely for a resource", "Two processes are continuously altering their state in response to each other", "A high-priority process is preempted by a low-priority one"]', 'A process is waiting indefinitely for a resource'),
('OS', 'Hard', 'What is the primary difference between a Mutex and a Semaphore?', '["A Mutex is an integer variable; a Semaphore is a lock", "A Semaphore can allow multiple threads; a Mutex allows exactly one", "A Mutex operates in kernel space; a Semaphore in user space", "There is no functional difference"]', 'A Semaphore can allow multiple threads; a Mutex allows exactly one'),
('OS', 'Medium', 'Which page replacement algorithm suffers from Belady''s Anomaly?', '["LRU (Least Recently Used)", "Optimal", "FIFO (First-In, First-Out)", "MRU (Most Recently Used)"]', 'FIFO (First-In, First-Out)'),

-- DBMS (Database Management Systems)
('DBMS', 'Medium', 'Which normal form dictates that there should be no transitive dependency for non-prime attributes?', '["First Normal Form (1NF)", "Second Normal Form (2NF)", "Third Normal Form (3NF)", "Boyce-Codd Normal Form (BCNF)"]', 'Third Normal Form (3NF)'),
('DBMS', 'Hard', 'What does the ACID property "Isolation" guarantee in a database transaction?', '["Transactions run sequentially", "Transactions are permanent once committed", "Concurrent transactions do not affect each other", "Data remains consistent before and after"]', 'Concurrent transactions do not affect each other'),
('DBMS', 'Medium', 'Which SQL statement is used to remove a table entirely, including its structure and data?', '["DELETE TABLE", "TRUNCATE TABLE", "DROP TABLE", "REMOVE TABLE"]', 'DROP TABLE'),
('DBMS', 'Hard', 'What is the primary advantage of using a B+ tree index over a B tree index?', '["B+ trees store data in internal nodes for faster access", "B+ trees keep all data pointers in leaf nodes, allowing faster sequential access", "B+ trees require less memory overhead", "B+ trees are self-balancing while B trees are not"]', 'B+ trees keep all data pointers in leaf nodes, allowing faster sequential access'),
('DBMS', 'Medium', 'In a relational database, what is a Foreign Key?', '["A key that uniquely identifies a row", "A key used specifically for encrypting data", "A column that refers to the primary key of another table", "An auto-incrementing integer"]', 'A column that refers to the primary key of another table'),

-- Aptitude
('Aptitude', 'Medium', 'A train 150m long is running at 60 km/h. How many seconds will it take to cross a 300m long bridge?', '["20", "27", "18", "25"]', '27'),
('Aptitude', 'Hard', 'A can do a piece of work in 15 days and B alone can do it in 20 days. They work together for 4 days, then A leaves. How many days will B take to finish the remaining work?', '["10 days", "10.66 days", "8 days", "12 days"]', '10.66 days'),
('Aptitude', 'Medium', 'The sum of ages of 5 children born at intervals of 3 years each is 50 years. What is the age of the youngest child?', '["4 years", "8 years", "10 years", "2 years"]', '4 years'),
('Aptitude', 'Hard', 'In how many different ways can the letters of the word "OPTICAL" be arranged so that the vowels always come together?', '["120", "720", "4320", "2160"]', '720'),
('Aptitude', 'Medium', 'If the cost price of 20 articles is equal to the selling price of 15 articles, what is the profit percentage?', '["25%", "33.33%", "20%", "30%"]', '33.33%'),

-- AI (Artificial Intelligence)
('AI', 'Medium', 'Which algorithm is used in neural networks to calculate the gradient of the loss function with respect to weights?', '["K-Means", "Support Vector Machine", "Backpropagation", "A* Search"]', 'Backpropagation'),
('AI', 'Hard', 'In the context of reinforcement learning, what does the Bellman Equation help compute?', '["The learning rate", "The optimal policy and value function", "The activation function output", "The classification boundary"]', 'The optimal policy and value function'),
('AI', 'Medium', 'What is the primary purpose of a Convolutional Neural Network (CNN)?', '["Time-series forecasting", "Natural Language Processing", "Image processing and pattern recognition", "Sorting numerical arrays"]', 'Image processing and pattern recognition'),
('AI', 'Hard', 'What issue arises when a deep neural network suffers from "Vanishing Gradients"?', '["The model overfits the training data instantly", "The early layers fail to learn because gradients become too small", "The network predicts infinite outputs", "The learning rate becomes too large"]', 'The early layers fail to learn because gradients become too small'),
('AI', 'Medium', 'Which of the following is an example of Unsupervised Learning?', '["Linear Regression", "Decision Trees", "K-Means Clustering", "Random Forest"]', 'K-Means Clustering');
