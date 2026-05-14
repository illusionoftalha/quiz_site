-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: quiz
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_users`
--

DROP TABLE IF EXISTS `admin_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(60) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `last_login` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_users`
--

LOCK TABLES `admin_users` WRITE;
/*!40000 ALTER TABLE `admin_users` DISABLE KEYS */;
INSERT INTO `admin_users` VALUES (2,'talha','tbkhbk21',NULL,'2026-05-12 03:18:43',NULL);
/*!40000 ALTER TABLE `admin_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auto_saves`
--

DROP TABLE IF EXISTS `auto_saves`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auto_saves` (
  `session_id` int(11) NOT NULL,
  `challenge_code` varchar(20) NOT NULL,
  `saved_code` longtext NOT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`session_id`,`challenge_code`),
  CONSTRAINT `auto_saves_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `quiz_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auto_saves`
--

LOCK TABLES `auto_saves` WRITE;
/*!40000 ALTER TABLE `auto_saves` DISABLE KEYS */;
INSERT INTO `auto_saves` VALUES (10,'V_TEST_P1','#include <stdio.h>\n\nint main() {\n    print(\"Hello World\");\n    return 0;\n}','2026-05-12 10:28:40');
/*!40000 ALTER TABLE `auto_saves` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `code_submissions`
--

DROP TABLE IF EXISTS `code_submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `code_submissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` int(11) NOT NULL,
  `challenge_code` varchar(20) NOT NULL,
  `submitted_code` longtext NOT NULL,
  `language` varchar(20) DEFAULT 'C',
  `submitted_at` datetime DEFAULT current_timestamp(),
  `verdict` enum('PENDING','ACCEPTED','WRONG_ANSWER','COMPILE_ERROR','RUNTIME_ERROR','TIME_LIMIT') DEFAULT 'PENDING',
  `cases_passed` tinyint(4) DEFAULT 0,
  `total_cases` tinyint(4) DEFAULT 5,
  `compiler_output` text DEFAULT NULL,
  `judge_output` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `session_id` (`session_id`),
  KEY `challenge_code` (`challenge_code`),
  CONSTRAINT `code_submissions_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `quiz_sessions` (`id`),
  CONSTRAINT `code_submissions_ibfk_2` FOREIGN KEY (`challenge_code`) REFERENCES `coding_challenges` (`challenge_code`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `code_submissions`
--

LOCK TABLES `code_submissions` WRITE;
/*!40000 ALTER TABLE `code_submissions` DISABLE KEYS */;
INSERT INTO `code_submissions` VALUES (8,5,'V_TEST_P1','#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char str[101];\n    int count = 0;\n\n    scanf(\"%s\", str);\n\n    for (int i = 0; i < strlen(str); i++) {\n        if (str[i] == \'a\' || str[i] == \'e\' || str[i] == \'i\' || \n            str[i] == \'o\' || str[i] == \'u\') {\n            count++;\n        }\n    }\n\n    printf(\"%d\", count);\n\n    return 0;\n}','C','2026-05-12 04:39:17','ACCEPTED',1,1,'',NULL),(9,5,'V_TEST_P2','#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char str1[101], str2[101];\n\n    scanf(\"%s\", str1);\n    scanf(\"%s\", str2);\n\n    if (strcmp(str1, str2) == 0) {\n        printf(\"Same\");\n    } else {\n        printf(\"Different\");\n    }\n\n    return 0;\n}','C','2026-05-12 04:39:29','ACCEPTED',1,1,'',NULL),(10,5,'V_TEST_P3','#include <stdio.h>\n\nint main() {\n    int n, arr[50];\n    int sum = 0;\n\n    scanf(\"%d\", &n);\n\n    for (int i = 0; i < n; i++) {\n        scanf(\"%d\", &arr[i]);\n        sum += arr[i];\n    }\n\n    printf(\"%d\", sum);\n\n    return 0;\n}','C','2026-05-12 04:39:38','ACCEPTED',1,1,'',NULL),(11,5,'V_TEST_P4','#include <stdio.h>\n\nint main() {\n    int n, reverse = 0;\n\n    scanf(\"%d\", &n);\n\n    while (n != 0) {\n        reverse = reverse * 10 + (n % 10);\n        n /= 10;\n    }\n\n    printf(\"%d\", reverse);\n\n    return 0;\n}','C','2026-05-12 04:39:45','ACCEPTED',1,1,'',NULL),(12,5,'V_TEST_P5','#include <stdio.h>\n\nint main() {\n    int n, arr[50];\n\n    scanf(\"%d\", &n);\n\n    for (int i = 0; i < n; i++) {\n        scanf(\"%d\", &arr[i]);\n    }\n\n    int max = arr[0];\n\n    for (int i = 1; i < n; i++) {\n        if (arr[i] > max) {\n            max = arr[i];\n        }\n    }\n\n    printf(\"%d\", max);\n\n    return 0;\n}','C','2026-05-12 04:39:53','ACCEPTED',2,2,'',NULL),(13,10,'V_TEST_P1','#include <stdio.h>\n\nint main() {\n    print(\"Hello World\");\n    return 0;\n}','C','2026-05-12 10:29:03','COMPILE_ERROR',0,5,'D:\\Quiz\\tmp\\code_1778563743187.c: In function \'main\':\r\nD:\\Quiz\\tmp\\code_1778563743187.c:4:5: warning: implicit declaration of function \'print\' [-Wimplicit-function-declaration]\r\n     print(\"Hello World\");\r\n     ^~~~~\r\nC:\\Users\\CORECO~1\\AppData\\Local\\Temp\\ccw65sCN.o:code_1778563743187.c:(.text+0x16): undefined reference to `print\'\r\ncollect2.exe: error: ld returned 1 exit status\r\n',NULL),(14,10,'V_TEST_P2','#include <stdio.h>\n\nint main() {\n    // Write C code here\n    return 0;\n}','C','2026-05-12 10:30:27','WRONG_ANSWER',0,1,'[ INPUT ]\ntest\ntest\n\n[ EXPECTED OUTPUT ]\nSame\n\n[ ACTUAL OUTPUT ]\n',NULL),(15,10,'V_TEST_P3','#include <stdio.h>\n\nint main() {\n    // Write C code here\n    return 0;\n}','C','2026-05-12 10:30:29','WRONG_ANSWER',0,1,'[ INPUT ]\n3\n1 2 3\n\n[ EXPECTED OUTPUT ]\n6\n\n[ ACTUAL OUTPUT ]\n',NULL),(16,10,'V_TEST_P4','#include <stdio.h>\n\nint main() {\n    // Write C code here\n    return 0;\n}','C','2026-05-12 10:30:32','WRONG_ANSWER',0,1,'[ INPUT ]\n1234\n\n[ EXPECTED OUTPUT ]\n4321\n\n[ ACTUAL OUTPUT ]\n',NULL),(17,10,'V_TEST_P5','#include <stdio.h>\n\nint main() {\n    // Write C code here\n    return 0;\n}','C','2026-05-12 10:30:36','WRONG_ANSWER',0,2,'[ INPUT ]\n4\n1 5 3 2\n\n[ EXPECTED OUTPUT ]\n5\n\n[ ACTUAL OUTPUT ]\n',NULL);
/*!40000 ALTER TABLE `code_submissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coding_challenges`
--

DROP TABLE IF EXISTS `coding_challenges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `coding_challenges` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `challenge_code` varchar(20) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `constraints_txt` text DEFAULT NULL,
  `sample_input` text DEFAULT NULL,
  `sample_output` text DEFAULT NULL,
  `difficulty` enum('EASY','MEDIUM','HARD') DEFAULT 'EASY',
  `created_at` datetime DEFAULT current_timestamp(),
  `version_code` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `challenge_code` (`challenge_code`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coding_challenges`
--

LOCK TABLES `coding_challenges` WRITE;
/*!40000 ALTER TABLE `coding_challenges` DISABLE KEYS */;
INSERT INTO `coding_challenges` VALUES (26,'V007_P1','Max in Array','Find the maximum number in an array of N integers.','1 <= N <= 50','4\n1 5 3 2','5','EASY','2026-05-12 03:43:50','V007'),(27,'V007_P2','Circle Area','Calculate area of a circle with radius R. Use PI=3.14. Print 2 decimal places.','1 <= R <= 100','5','78.50','EASY','2026-05-12 03:43:50','V007'),(28,'V007_P3','String Compare','Read two strings and print \"Same\" if they are identical, else \"Different\".','No spaces','test\ntest','Same','EASY','2026-05-12 03:43:50','V007'),(29,'V007_P4','Triangle Pattern','Print a right-aligned triangle pattern of stars with N rows.','1 <= N <= 10','3','  *\n **\n***','EASY','2026-05-12 03:43:50','V007'),(30,'V007_P5','Prime Check','Check if a number N is prime. Print \"Prime\" or \"Not Prime\".','1 <= N <= 100','7','Prime','EASY','2026-05-12 03:43:50','V007'),(31,'V016_P1','Triangle Pattern','Print a right-aligned triangle pattern of stars with N rows.','1 <= N <= 10','3','  *\n **\n***','EASY','2026-05-12 03:43:50','V016'),(32,'V016_P2','Circle Area','Calculate area of a circle with radius R. Use PI=3.14. Print 2 decimal places.','1 <= R <= 100','5','78.50','EASY','2026-05-12 03:43:50','V016'),(33,'V016_P3','Sum of Array','Find the sum of all elements in an array. First line is N (size), next line is N space-separated integers.','1 <= N <= 50','3\n1 2 3','6','EASY','2026-05-12 03:43:50','V016'),(34,'V016_P4','String Compare','Read two strings and print \"Same\" if they are identical, else \"Different\".','No spaces','test\ntest','Same','EASY','2026-05-12 03:43:50','V016'),(35,'V016_P5','Prime Check','Check if a number N is prime. Print \"Prime\" or \"Not Prime\".','1 <= N <= 100','7','Prime','EASY','2026-05-12 03:43:50','V016'),(36,'V020_P1','Triangle Pattern','Print a right-aligned triangle pattern of stars with N rows.','1 <= N <= 10','3','  *\n **\n***','EASY','2026-05-12 03:43:50','V020'),(37,'V020_P2','Square and Cube','Write functions to calculate square and cube. Print \"Sq: X, Cu: Y\".','1 <= N <= 10','3','Sq: 9, Cu: 27','EASY','2026-05-12 03:43:50','V020'),(38,'V020_P3','Power Function','Read base and exponent, print base^exponent using pow().','1 <= base, exp <= 5','2 3','8','EASY','2026-05-12 03:43:50','V020'),(39,'V020_P4','Multiplication Table','Print the multiplication table of N up to 5.','1 <= N <= 10','2','2\n4\n6\n8\n10','EASY','2026-05-12 03:43:50','V020'),(40,'V020_P5','Max in Array','Find the maximum number in an array of N integers.','1 <= N <= 50','4\n1 5 3 2','5','EASY','2026-05-12 03:43:50','V020'),(41,'V023_P1','Square Root','Calculate the square root of N using sqrt(). Print 2 decimal places.','1 <= N <= 100','16','4.00','EASY','2026-05-12 03:43:50','V023'),(42,'V023_P2','Even/Odd Sums','Calculate the sum of all even and odd numbers from 1 to N separately. Print \"Even: X, Odd: Y\".','1 <= N <= 100','4','Even: 6, Odd: 4','EASY','2026-05-12 03:43:50','V023'),(43,'V023_P3','Triangle Pattern','Print a right-aligned triangle pattern of stars with N rows.','1 <= N <= 10','3','  *\n **\n***','EASY','2026-05-12 03:43:50','V023'),(44,'V023_P4','Palindrome Check','Write a function to check if a number is a palindrome. Print \"Yes\" or \"No\".','10 <= N <= 99999','121','Yes','EASY','2026-05-12 03:43:50','V023'),(45,'V023_P5','Square and Cube','Write functions to calculate square and cube. Print \"Sq: X, Cu: Y\".','1 <= N <= 10','3','Sq: 9, Cu: 27','EASY','2026-05-12 03:43:50','V023'),(46,'V_TEST_P1','Vowel Counter','Count the number of vowels in a string (all lowercase).','String length <= 100','hello','2','EASY','2026-05-12 03:43:50','V_TEST'),(47,'V_TEST_P2','String Compare','Read two strings and print \"Same\" if they are identical, else \"Different\".','No spaces','test\ntest','Same','EASY','2026-05-12 03:43:50','V_TEST'),(48,'V_TEST_P3','Sum of Array','Find the sum of all elements in an array. First line is N (size), next line is N space-separated integers.','1 <= N <= 50','3\n1 2 3','6','EASY','2026-05-12 03:43:50','V_TEST'),(49,'V_TEST_P4','Reverse Digits','Reverse the digits of a given integer N.','10 <= N <= 9999','1234','4321','EASY','2026-05-12 03:43:50','V_TEST'),(50,'V_TEST_P5','Max in Array','Find the maximum number in an array of N integers.','1 <= N <= 50','4\n1 5 3 2','5','EASY','2026-05-12 03:43:50','V_TEST');
/*!40000 ALTER TABLE `coding_challenges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mcq_answers`
--

DROP TABLE IF EXISTS `mcq_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mcq_answers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `selected_option` tinyint(4) DEFAULT NULL,
  `is_correct` tinyint(1) DEFAULT NULL,
  `answered_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_session_question` (`session_id`,`question_id`),
  KEY `question_id` (`question_id`),
  CONSTRAINT `mcq_answers_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `quiz_sessions` (`id`),
  CONSTRAINT `mcq_answers_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `mcq_questions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mcq_answers`
--

LOCK TABLES `mcq_answers` WRITE;
/*!40000 ALTER TABLE `mcq_answers` DISABLE KEYS */;
INSERT INTO `mcq_answers` VALUES (1,10,361,0,1,'2026-05-12 10:11:53'),(2,10,362,3,0,'2026-05-12 10:11:53'),(3,10,363,3,1,'2026-05-12 10:11:53'),(4,10,364,3,0,'2026-05-12 10:11:53'),(5,10,365,3,0,'2026-05-12 10:11:53'),(6,10,366,3,1,'2026-05-12 10:11:53'),(7,10,367,3,0,'2026-05-12 10:11:53'),(8,10,368,3,0,'2026-05-12 10:11:53'),(9,10,369,3,1,'2026-05-12 10:11:53'),(10,10,370,3,0,'2026-05-12 10:11:53'),(11,10,371,3,0,'2026-05-12 10:11:53'),(12,10,372,3,0,'2026-05-12 10:11:53'),(13,10,373,3,0,'2026-05-12 10:11:53'),(14,10,374,3,0,'2026-05-12 10:11:53'),(15,10,375,3,0,'2026-05-12 10:11:53'),(16,10,376,3,1,'2026-05-12 10:11:53'),(17,10,377,3,0,'2026-05-12 10:11:53'),(18,10,378,3,0,'2026-05-12 10:11:53'),(19,10,379,3,1,'2026-05-12 10:11:53'),(20,10,380,3,0,'2026-05-12 10:11:53'),(21,10,381,3,1,'2026-05-12 10:11:53'),(22,10,382,3,0,'2026-05-12 10:11:53'),(23,10,383,3,0,'2026-05-12 10:11:53'),(24,10,384,3,0,'2026-05-12 10:11:53'),(25,10,385,3,0,'2026-05-12 10:11:53'),(26,10,386,3,1,'2026-05-12 10:11:53'),(27,10,387,3,1,'2026-05-12 10:11:53'),(28,10,388,3,0,'2026-05-12 10:11:53'),(29,10,389,3,1,'2026-05-12 10:11:53'),(30,10,390,3,0,'2026-05-12 10:11:53');
/*!40000 ALTER TABLE `mcq_answers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mcq_questions`
--

DROP TABLE IF EXISTS `mcq_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mcq_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `version_code` varchar(20) NOT NULL,
  `q_number` tinyint(4) NOT NULL,
  `lab_tag` varchar(20) NOT NULL,
  `topic` varchar(50) NOT NULL,
  `question_text` text NOT NULL,
  `code_snippet` text DEFAULT NULL,
  `option_a` text NOT NULL,
  `option_b` text NOT NULL,
  `option_c` text NOT NULL,
  `option_d` text NOT NULL,
  `correct_option` tinyint(4) NOT NULL,
  `explanation` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_version_qnum` (`version_code`,`q_number`),
  CONSTRAINT `mcq_questions_ibfk_1` FOREIGN KEY (`version_code`) REFERENCES `quiz_versions` (`version_code`)
) ENGINE=InnoDB AUTO_INCREMENT=391 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mcq_questions`
--

LOCK TABLES `mcq_questions` WRITE;
/*!40000 ALTER TABLE `mcq_questions` DISABLE KEYS */;
INSERT INTO `mcq_questions` VALUES (241,'V007',1,'','General','What is the purpose of the return 0; statement in main?',NULL,'Indicates successful execution','Returns the value 0 to the user','Restarts the program','Terminates the program forcefully',0,NULL),(242,'V007',2,'','Nested Loops','Which loop is evaluated first in a nested loop setup?',NULL,'Depends on the compiler','Both run simultaneously','Inner loop starts first','Outer loop starts, then inner loop runs to completion',3,NULL),(243,'V007',3,'','Arrays','How do you declare an integer array of size 10?',NULL,'int[10] arr;','int arr(10);','array int[10];','int arr[10];',3,NULL),(244,'V007',4,'','General','Which format specifier is used for a single character?',NULL,'%c','%s','%char','%d',0,NULL),(245,'V007',5,'','Comments','How do you write a multi-line comment in C?',NULL,'/* comment */','// comment //','<!-- comment -->','# comment #',0,NULL),(246,'V007',6,'','Operators','Which operator is used for Logical AND?',NULL,'||','&','&&','AND',2,NULL),(247,'V007',7,'','General','Which header contains string manipulation functions?',NULL,'<string.h>','<strings.h>','<str.h>','<stdlib.h>',0,NULL),(248,'V007',8,'','Nested Loops','How many times will the inner loop execute if outer runs 3 times and inner runs 4 times?',NULL,'12','3','7','4',0,NULL),(249,'V007',9,'','General','What is the output of 5 == 5 ? 1 : 0;',NULL,'5','0','1','Error',2,NULL),(250,'V007',10,'','Two-Dimensional Array','How to access the element in 2nd row and 3rd column? (0-indexed)',NULL,'arr[2,3]','arr[1,2]','arr[2][3]','arr[1][2]',3,NULL),(251,'V007',11,'','Conditional','Which keyword is used to handle alternative cases in an if statement?',NULL,'else','elif','otherwise','then',0,NULL),(252,'V007',12,'','Switch','What keyword breaks out of a switch case?',NULL,'stop','break','return','exit',1,NULL),(253,'V007',13,'','Constants','What is the difference between #define and const?',NULL,'#define is a preprocessor directive, const is a keyword','Both are same','#define allocates memory','const cannot be used for integers',0,NULL),(254,'V007',14,'','General','Can an array hold mixed data types in C?',NULL,'Only if declared as dynamic','Yes','No','Only strings and chars',2,NULL),(255,'V007',15,'','Conditional','Evaluate: (5 > 3) && (2 < 4)',NULL,'1 (True)','0 (False)','Syntax Error','Undefined',0,NULL),(256,'V007',16,'','Hello World','Which header file is required to use printf() in C?',NULL,'#include <conio.h>','#include <math.h>','#include <stdio.h>','#include <stdlib.h>',2,NULL),(257,'V007',17,'','Goto','Why is the goto statement generally discouraged in C?',NULL,'It makes code difficult to read and maintain','It crashes the compiler','It causes syntax errors','It is slow',0,NULL),(258,'V007',18,'','General','How do you access the value at index 2 of an array named arr?',NULL,'arr[2]','arr.2','arr(2)','arr<2>',0,NULL),(259,'V007',19,'','Algorithms','An algorithm is:',NULL,'A computer program','A C library','A step-by-step procedure to solve a problem','A type of hardware',2,NULL),(260,'V007',20,'','General','Which function is used to read formatted input from the user?',NULL,'scanf()','get()','read()','input()',0,NULL),(261,'V007',21,'','Data Types','What is the size of an int in a 32-bit system typically?',NULL,'4 bytes','2 bytes','1 byte','8 bytes',0,NULL),(262,'V007',22,'','Division','What is the result of 5 / 2 in C?',NULL,'2','2.0','2.5','3',0,NULL),(263,'V007',23,'','General','Which statement is true about while and do-while?',NULL,'do-while checks condition at the end','while checks condition at the end','They are exactly the same','do-while is faster',0,NULL),(264,'V007',24,'','Hello World','Which escape sequence is used for a new line?',NULL,'\\r','\\t','\\n','\\a',2,NULL),(265,'V007',25,'','Arrays','What is the index of the first element in a C array?',NULL,'0','Depends','1','-1',0,NULL),(266,'V007',26,'','String Functions','Which function copies a string?',NULL,'strcopy()','cpy()','strcpy()','copy()',2,NULL),(267,'V007',27,'','Loops','Which loop is guaranteed to execute at least once?',NULL,'nested','for','while','do-while',3,NULL),(268,'V007',28,'','Nested if','Can an if statement be placed inside another if statement?',NULL,'No, never','Yes, always','Only if else is present','Only in main()',1,NULL),(269,'V007',29,'','General','Which of the following is an assignment operator?',NULL,'==','=','===','!=',1,NULL),(270,'V007',30,'','Type Casting','What happens when a float is assigned to an int variable?',NULL,'Fractional part is truncated','Value is rounded','Compiler error','Program crashes',0,NULL),(271,'V016',1,'','Conditional','Evaluate: (5 > 3) && (2 < 4)',NULL,'0 (False)','Undefined','1 (True)','Syntax Error',2,NULL),(272,'V016',2,'','Switch','Which type of value cannot be evaluated in a switch case?',NULL,'float','enum','char','int',0,NULL),(273,'V016',3,'','Type Casting','How do you explicitly cast a float x to an int?',NULL,'(integer)x','int(x)','cast<int>(x)','(int)x',3,NULL),(274,'V016',4,'','For Loop','What are the three parts of a for loop declaration?',NULL,'Initialize, Execute, Break','Condition, Execution, Update','Start, Stop, Step','Initialization, Condition, Increment/Decrement',3,NULL),(275,'V016',5,'','Nested Loops','How many times will the inner loop execute if outer runs 3 times and inner runs 4 times?',NULL,'7','3','4','12',3,NULL),(276,'V016',6,'','Operators','What is the result of 5 % 2?',NULL,'2.5','1','0','2',1,NULL),(277,'V016',7,'','General','What is the correct way to declare a 2D array?',NULL,'int arr[3][4];','int arr[3,4];','int arr(3)(4);','int arr[3 * 4];',0,NULL),(278,'V016',8,'','Strings','What is a string in C?',NULL,'A pointer to int','An array of characters ending with \\0','A primitive data type','An object',1,NULL),(279,'V016',9,'','Arrays','What happens if you access an array out of bounds?',NULL,'Undefined behavior','Compiler error','Returns 0','Program safely exits',0,NULL),(280,'V016',10,'','Operators','Which operator is used for Logical AND?',NULL,'AND','||','&','&&',3,NULL),(281,'V016',11,'','Main Function','What is the correct signature for the main function in a standard C program?',NULL,'main(void)','int Main()','void main()','int main()',3,NULL),(282,'V016',12,'','General','What does ++x do?',NULL,'Increments x before its value is used','Adds 2 to x','Syntax error','Increments x after its value is used',0,NULL),(283,'V016',13,'','Division','What is the result of 5 / 2 in C?',NULL,'3','2.5','2','2.0',2,NULL),(284,'V016',14,'','Algorithms','An algorithm is:',NULL,'A type of hardware','A computer program','A step-by-step procedure to solve a problem','A C library',2,NULL),(285,'V016',15,'','General','What is the output of 10 % 3?',NULL,'1','3','3.33','0',0,NULL),(286,'V016',16,'','Arrays','How do you declare an integer array of size 10?',NULL,'int[10] arr;','int arr(10);','array int[10];','int arr[10];',3,NULL),(287,'V016',17,'','Strings','Which character terminates a C string?',NULL,'\'\\0\'','\'\\r\'','\'\\n\'','\'EOF\'',0,NULL),(288,'V016',18,'','Constants','What is the difference between #define and const?',NULL,'Both are same','const cannot be used for integers','#define is a preprocessor directive, const is a keyword','#define allocates memory',2,NULL),(289,'V016',19,'','General','Which function is used to read formatted input from the user?',NULL,'scanf()','read()','input()','get()',0,NULL),(290,'V016',20,'','Nested Loops','Which loop is evaluated first in a nested loop setup?',NULL,'Outer loop starts, then inner loop runs to completion','Depends on the compiler','Inner loop starts first','Both run simultaneously',0,NULL),(291,'V016',21,'','Conditional','Which of the following is the ternary operator?',NULL,'??','::','?:','->',2,NULL),(292,'V016',22,'','General','What is the size of a char in C?',NULL,'1 byte','2 bytes','4 bytes','Depends on system',0,NULL),(293,'V016',23,'','Loops','Which loop is guaranteed to execute at least once?',NULL,'nested','for','while','do-while',3,NULL),(294,'V016',24,'','General','What is the correct syntax for an if statement?',NULL,'if [condition] {}','if (condition) {}','if condition then {}','if condition {}',1,NULL),(295,'V016',25,'','General','Which header contains string manipulation functions?',NULL,'<stdlib.h>','<strings.h>','<str.h>','<string.h>',3,NULL),(296,'V016',26,'','Two-Dimensional Array','How to access the element in 2nd row and 3rd column? (0-indexed)',NULL,'arr[2,3]','arr[1][2]','arr[2][3]','arr[1,2]',1,NULL),(297,'V016',27,'','Variables','Which of the following is a valid variable name in C?',NULL,'_myVar','1myVar','my-Var','int',0,NULL),(298,'V016',28,'','Compiler Error','What error will occur if you forget a semicolon at the end of a statement?',NULL,'Runtime Error','Linker Error','Logical Error','Syntax Error',3,NULL),(299,'V016',29,'','Conditional','Which keyword is used to handle alternative cases in an if statement?',NULL,'then','otherwise','elif','else',3,NULL),(300,'V016',30,'','Flowcharts','Which shape represents an input/output operation?',NULL,'Oval','Parallelogram','Diamond','Rectangle',1,NULL),(301,'V020',1,'','Goto','Why is the goto statement generally discouraged in C?',NULL,'It is slow','It causes syntax errors','It makes code difficult to read and maintain','It crashes the compiler',2,NULL),(302,'V020',2,'','Loops','What is an infinite loop?',NULL,'A loop with a break statement','A loop that never terminates','A loop with no condition','A loop inside a loop',1,NULL),(303,'V020',3,'','Hello World','Which escape sequence is used for a new line?',NULL,'\\a','\\r','\\t','\\n',3,NULL),(304,'V020',4,'','General','Which function is used to read formatted input from the user?',NULL,'get()','input()','read()','scanf()',3,NULL),(305,'V020',5,'','Arrays','What is the index of the first element in a C array?',NULL,'Depends','1','0','-1',2,NULL),(306,'V020',6,'','Nested if','Can an if statement be placed inside another if statement?',NULL,'Only if else is present','Yes, always','Only in main()','No, never',1,NULL),(307,'V020',7,'','Two-Dimensional Array','How to access the element in 2nd row and 3rd column? (0-indexed)',NULL,'arr[1][2]','arr[2][3]','arr[1,2]','arr[2,3]',0,NULL),(308,'V020',8,'','Constants','What is the difference between #define and const?',NULL,'const cannot be used for integers','Both are same','#define allocates memory','#define is a preprocessor directive, const is a keyword',3,NULL),(309,'V020',9,'','Nested Loops','How many times will the inner loop execute if outer runs 3 times and inner runs 4 times?',NULL,'12','4','3','7',0,NULL),(310,'V020',10,'','Switch','Which type of value cannot be evaluated in a switch case?',NULL,'float','int','char','enum',0,NULL),(311,'V020',11,'','Flowcharts','Which shape represents a decision in a flowchart?',NULL,'Parallelogram','Oval','Rectangle','Diamond',3,NULL),(312,'V020',12,'','General','What is the output of 5 == 5 ? 1 : 0;',NULL,'Error','5','0','1',3,NULL),(313,'V020',13,'','Loops','Which loop is guaranteed to execute at least once?',NULL,'for','while','do-while','nested',2,NULL),(314,'V020',14,'','Division','What is the result of 5.0 / 2?',NULL,'Error','2.5','2','2.0',1,NULL),(315,'V020',15,'','Break','What does the break statement do inside a loop?',NULL,'Pauses the loop','Terminates the loop immediately','Skips the current iteration','Restarts the loop',1,NULL),(316,'V020',16,'','Scope','Variables declared inside a function are called:',NULL,'Local variables','Global variables','Static variables','External variables',0,NULL),(317,'V020',17,'','Precedence','Which operator has the highest precedence?',NULL,'=','+','*','()',3,NULL),(318,'V020',18,'','Conditional','Evaluate: (5 > 3) && (2 < 4)',NULL,'Syntax Error','Undefined','0 (False)','1 (True)',3,NULL),(319,'V020',19,'','Functions','If a function does not return a value, its return type should be:',NULL,'void','empty','int','null',0,NULL),(320,'V020',20,'','String Functions','Which function copies a string?',NULL,'strcopy()','strcpy()','cpy()','copy()',1,NULL),(321,'V020',21,'','Comments','How do you write a multi-line comment in C?',NULL,'# comment #','<!-- comment -->','// comment //','/* comment */',3,NULL),(322,'V020',22,'','Parameters','What is the purpose of function parameters?',NULL,'To name the function','To pass data into the function','To declare local variables','To return data from the function',1,NULL),(323,'V020',23,'','Conditional','Which keyword is used to handle alternative cases in an if statement?',NULL,'else','elif','then','otherwise',0,NULL),(324,'V020',24,'','General','What does %d stand for in printf?',NULL,'Decimal integer','Double','Data','Digit character',0,NULL),(325,'V020',25,'','String Functions','Which function finds the length of a string?',NULL,'len()','length()','strlength()','strlen()',3,NULL),(326,'V020',26,'','Variables','Which of the following is a valid variable name in C?',NULL,'_myVar','1myVar','my-Var','int',0,NULL),(327,'V020',27,'','Operators','What is the result of 5 % 2?',NULL,'1','2','0','2.5',0,NULL),(328,'V020',28,'','General','What is the purpose of the return 0; statement in main?',NULL,'Indicates successful execution','Returns the value 0 to the user','Terminates the program forcefully','Restarts the program',0,NULL),(329,'V020',29,'','Data Types','What is the size of an int in a 32-bit system typically?',NULL,'4 bytes','2 bytes','8 bytes','1 byte',0,NULL),(330,'V020',30,'','General','What is the output of printf(\"%d\", 10 + 5);?',NULL,'Error','15','10 + 5','105',1,NULL),(331,'V023',1,'','Variables','Which of the following is a valid variable name in C?',NULL,'int','my-Var','1myVar','_myVar',3,NULL),(332,'V023',2,'','General','How do you initialize an array during declaration?',NULL,'int arr[] = {1, 2, 3};','int arr[] = [1, 2, 3];','int arr() = {1, 2, 3};','int arr{3} = 1, 2, 3;',0,NULL),(333,'V023',3,'','General','What is the output of printf(\"%d\", 10 + 5);?',NULL,'Error','10 + 5','105','15',3,NULL),(334,'V023',4,'','Precedence','Evaluate: 3 + 4 * 2',NULL,'11','14','24','10',0,NULL),(335,'V023',5,'','Loops','Which loop is best when the number of iterations is known?',NULL,'if','while','for','do-while',2,NULL),(336,'V023',6,'','Conditional','Which of the following is the ternary operator?',NULL,'::','??','->','?:',3,NULL),(337,'V023',7,'','Arrays','What happens if you access an array out of bounds?',NULL,'Compiler error','Returns 0','Program safely exits','Undefined behavior',3,NULL),(338,'V023',8,'','General','What is the output of 5 == 5 ? 1 : 0;',NULL,'0','1','5','Error',1,NULL),(339,'V023',9,'','Operators','What is the result of 5 % 2?',NULL,'1','2','2.5','0',0,NULL),(340,'V023',10,'','Constants','What is the difference between #define and const?',NULL,'const cannot be used for integers','#define allocates memory','Both are same','#define is a preprocessor directive, const is a keyword',3,NULL),(341,'V023',11,'','Arrays','What is the index of the first element in a C array?',NULL,'Depends','1','0','-1',2,NULL),(342,'V023',12,'','Algorithms','An algorithm is:',NULL,'A type of hardware','A computer program','A C library','A step-by-step procedure to solve a problem',3,NULL),(343,'V023',13,'','Loops','Which loop is guaranteed to execute at least once?',NULL,'while','do-while','nested','for',1,NULL),(344,'V023',14,'','Division','What is the result of 5.0 / 2?',NULL,'2','2.5','2.0','Error',1,NULL),(345,'V023',15,'','General','Which operator is used to get the memory address of a variable?',NULL,'->','@','*','&',3,NULL),(346,'V023',16,'','Nested Loops','How many times will the inner loop execute if outer runs 3 times and inner runs 4 times?',NULL,'3','12','4','7',1,NULL),(347,'V023',17,'','Break','What does the break statement do inside a loop?',NULL,'Pauses the loop','Restarts the loop','Skips the current iteration','Terminates the loop immediately',3,NULL),(348,'V023',18,'','Type Casting','How do you explicitly cast a float x to an int?',NULL,'cast<int>(x)','(integer)x','int(x)','(int)x',3,NULL),(349,'V023',19,'','Continue','What does the continue statement do?',NULL,'Skips the rest of the current iteration','Restarts the program','Goes to a label','Exits the loop',0,NULL),(350,'V023',20,'','Switch','Which type of value cannot be evaluated in a switch case?',NULL,'char','enum','int','float',3,NULL),(351,'V023',21,'','Nested if','Can an if statement be placed inside another if statement?',NULL,'No, never','Only if else is present','Yes, always','Only in main()',2,NULL),(352,'V023',22,'','String Functions','Which function copies a string?',NULL,'cpy()','strcopy()','strcpy()','copy()',2,NULL),(353,'V023',23,'','Hello World','Which header file is required to use printf() in C?',NULL,'#include <math.h>','#include <stdlib.h>','#include <conio.h>','#include <stdio.h>',3,NULL),(354,'V023',24,'','Parameters','What is the purpose of function parameters?',NULL,'To pass data into the function','To return data from the function','To declare local variables','To name the function',0,NULL),(355,'V023',25,'','General','What is the correct way to declare a 2D array?',NULL,'int arr(3)(4);','int arr[3][4];','int arr[3,4];','int arr[3 * 4];',1,NULL),(356,'V023',26,'','Division','What is the result of 5 / 2 in C?',NULL,'3','2.5','2.0','2',3,NULL),(357,'V023',27,'','Goto','Why is the goto statement generally discouraged in C?',NULL,'It is slow','It makes code difficult to read and maintain','It crashes the compiler','It causes syntax errors',1,NULL),(358,'V023',28,'','Constants','Which is correctly defining PI?',NULL,'#define PI 3.14','#DEFINE PI 3.14','#define PI = 3.14','define PI 3.14',0,NULL),(359,'V023',29,'','General','Which format specifier is used for a single character?',NULL,'%d','%char','%s','%c',3,NULL),(360,'V023',30,'','Functions','What is a function declaration (prototype)?',NULL,'Calling the function','The actual code of the function','Tells compiler about function name, return type, and parameters','Including a header file',2,NULL),(361,'V_TEST',1,'','General','Which function is used to read formatted input from the user?',NULL,'scanf()','read()','input()','get()',0,NULL),(362,'V_TEST',2,'','Conditional','Which of the following is the ternary operator?',NULL,'?:','::','??','->',0,NULL),(363,'V_TEST',3,'','Main Function','What is the correct signature for the main function in a standard C program?',NULL,'int Main()','main(void)','void main()','int main()',3,NULL),(364,'V_TEST',4,'','Flowcharts','Which shape represents a decision in a flowchart?',NULL,'Diamond','Rectangle','Oval','Parallelogram',0,NULL),(365,'V_TEST',5,'','Constants','Which is correctly defining PI?',NULL,'#define PI 3.14','#DEFINE PI 3.14','define PI 3.14','#define PI = 3.14',0,NULL),(366,'V_TEST',6,'','Type Casting','What happens when a float is assigned to an int variable?',NULL,'Compiler error','Value is rounded','Program crashes','Fractional part is truncated',3,NULL),(367,'V_TEST',7,'','Algorithms','An algorithm is:',NULL,'A step-by-step procedure to solve a problem','A computer program','A C library','A type of hardware',0,NULL),(368,'V_TEST',8,'','Precedence','Which operator has the highest precedence?',NULL,'()','*','+','=',0,NULL),(369,'V_TEST',9,'','While Loop','What happens if the condition in a while loop is initially false?',NULL,'Compiler error','It executes once','Infinite loop','The loop body does not execute',3,NULL),(370,'V_TEST',10,'','Loops','Which loop is best when the number of iterations is known?',NULL,'while','for','do-while','if',1,NULL),(371,'V_TEST',11,'','Hello World','Which escape sequence is used for a new line?',NULL,'\\r','\\t','\\n','\\a',2,NULL),(372,'V_TEST',12,'','Conditional','Evaluate: (5 > 3) && (2 < 4)',NULL,'1 (True)','Undefined','0 (False)','Syntax Error',0,NULL),(373,'V_TEST',13,'','General','Which header contains string manipulation functions?',NULL,'<string.h>','<strings.h>','<str.h>','<stdlib.h>',0,NULL),(374,'V_TEST',14,'','Constants','What is the difference between #define and const?',NULL,'#define allocates memory','Both are same','#define is a preprocessor directive, const is a keyword','const cannot be used for integers',2,NULL),(375,'V_TEST',15,'','Conditional','Which keyword is used to handle alternative cases in an if statement?',NULL,'else','elif','otherwise','then',0,NULL),(376,'V_TEST',16,'','Flowcharts','Which shape represents an input/output operation?',NULL,'Oval','Diamond','Rectangle','Parallelogram',3,NULL),(377,'V_TEST',17,'','Type Casting','How do you explicitly cast a float x to an int?',NULL,'int(x)','(int)x','cast<int>(x)','(integer)x',1,NULL),(378,'V_TEST',18,'','General','What does %d stand for in printf?',NULL,'Double','Decimal integer','Digit character','Data',1,NULL),(379,'V_TEST',19,'','General','What is the correct syntax for an if statement?',NULL,'if [condition] {}','if condition {}','if condition then {}','if (condition) {}',3,NULL),(380,'V_TEST',20,'','Precedence','Evaluate: 3 + 4 * 2',NULL,'11','14','24','10',0,NULL),(381,'V_TEST',21,'','Loops','What is an infinite loop?',NULL,'A loop inside a loop','A loop with a break statement','A loop with no condition','A loop that never terminates',3,NULL),(382,'V_TEST',22,'','Division','What is the result of 5 / 2 in C?',NULL,'2','2.5','3','2.0',0,NULL),(383,'V_TEST',23,'','Pseudocode','Pseudocode is:',NULL,'An informal high-level description of an algorithm','Machine code','A graphical diagram','A C compiler tool',0,NULL),(384,'V_TEST',24,'','Operators','What is the result of 5 % 2?',NULL,'1','2.5','2','0',0,NULL),(385,'V_TEST',25,'','General','How do you initialize an array during declaration?',NULL,'int arr{3} = 1, 2, 3;','int arr() = {1, 2, 3};','int arr[] = {1, 2, 3};','int arr[] = [1, 2, 3];',2,NULL),(386,'V_TEST',26,'','General','What is the size of a char in C?',NULL,'Depends on system','4 bytes','2 bytes','1 byte',3,NULL),(387,'V_TEST',27,'','Arrays','What happens if you access an array out of bounds?',NULL,'Program safely exits','Returns 0','Compiler error','Undefined behavior',3,NULL),(388,'V_TEST',28,'','Nested Loops','How many times will the inner loop execute if outer runs 3 times and inner runs 4 times?',NULL,'4','7','12','3',2,NULL),(389,'V_TEST',29,'','Variables','Which of the following is a valid variable name in C?',NULL,'int','my-Var','1myVar','_myVar',3,NULL),(390,'V_TEST',30,'','Switch','Which type of value cannot be evaluated in a switch case?',NULL,'int','float','char','enum',1,NULL);
/*!40000 ALTER TABLE `mcq_questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quiz_sessions`
--

DROP TABLE IF EXISTS `quiz_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quiz_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_token` varchar(64) NOT NULL,
  `roll_no` varchar(20) NOT NULL,
  `version_code` varchar(20) NOT NULL,
  `started_at` datetime DEFAULT current_timestamp(),
  `submitted_at` datetime DEFAULT NULL,
  `mcq_score` tinyint(4) DEFAULT NULL,
  `total_mcq` tinyint(4) DEFAULT NULL,
  `status` enum('IN_PROGRESS','SUBMITTED','ABANDONED') DEFAULT 'IN_PROGRESS',
  `ip_address` varchar(45) DEFAULT NULL,
  `time_remaining` int(11) DEFAULT 3600,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_token` (`session_token`),
  KEY `roll_no` (`roll_no`),
  KEY `version_code` (`version_code`),
  CONSTRAINT `quiz_sessions_ibfk_1` FOREIGN KEY (`roll_no`) REFERENCES `students` (`roll_no`),
  CONSTRAINT `quiz_sessions_ibfk_2` FOREIGN KEY (`version_code`) REFERENCES `quiz_versions` (`version_code`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quiz_sessions`
--

LOCK TABLES `quiz_sessions` WRITE;
/*!40000 ALTER TABLE `quiz_sessions` DISABLE KEYS */;
INSERT INTO `quiz_sessions` VALUES (4,'76b417c61ccae216481b1f09dad06d2377659427c806df56f1f36b5bb15aa39a','test','V_TEST','2026-05-12 04:30:50',NULL,NULL,NULL,'IN_PROGRESS',NULL,3600),(5,'a66d604b69c8d14b3142358c4621971abf76d343740025b3d7d072ee1de873bb','test','V_TEST','2026-05-12 04:38:15',NULL,NULL,NULL,'IN_PROGRESS',NULL,3600),(6,'a1f99804fc7a52d65089e66ba6c2aeecbb7d512b943dd99f0fc7a69036a905e9','test','V_TEST','2026-05-12 09:16:31',NULL,NULL,NULL,'IN_PROGRESS',NULL,3600),(7,'314910d481d8637c8e435e402bb2649fa1c60ccd7e0f562d64fda182c79180b3','test','V_TEST','2026-05-12 09:26:08',NULL,NULL,NULL,'IN_PROGRESS',NULL,3600),(8,'21fe817d17613f7634a52dbfacafa4085ac7e1df5c85e92437f29f001f8deb82','test','V_TEST','2026-05-12 09:31:53',NULL,NULL,NULL,'IN_PROGRESS',NULL,3600),(9,'a8fe9c0642136f8a8c0831004e4f9eb2c57b56b0281cf76453f7a51cdb6b88a6','test','V_TEST','2026-05-12 09:33:02',NULL,NULL,NULL,'IN_PROGRESS',NULL,3600),(10,'ad98d27e4eb72c7e20a85a5595dc4158090e63b3ddb5cfcd542b5a72b89f0089','test','V_TEST','2026-05-12 09:34:28',NULL,10,30,'SUBMITTED',NULL,2970);
/*!40000 ALTER TABLE `quiz_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quiz_versions`
--

DROP TABLE IF EXISTS `quiz_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quiz_versions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `version_code` varchar(20) NOT NULL,
  `roll_no` varchar(20) NOT NULL,
  `total_questions` tinyint(4) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `version_code` (`version_code`),
  KEY `roll_no` (`roll_no`),
  CONSTRAINT `quiz_versions_ibfk_1` FOREIGN KEY (`roll_no`) REFERENCES `students` (`roll_no`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quiz_versions`
--

LOCK TABLES `quiz_versions` WRITE;
/*!40000 ALTER TABLE `quiz_versions` DISABLE KEYS */;
INSERT INTO `quiz_versions` VALUES (1,'V007','26SP-007-SE',30,'2026-05-12 00:38:15'),(2,'V016','26SP-016-SE',30,'2026-05-12 00:38:15'),(3,'V020','26SP-020-SE',30,'2026-05-12 00:38:15'),(4,'V023','26SP-023-SE',30,'2026-05-12 00:38:15'),(6,'V_TEST','test',30,'2026-05-12 03:43:49');
/*!40000 ALTER TABLE `quiz_versions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `security_logs`
--

DROP TABLE IF EXISTS `security_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `security_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` int(11) NOT NULL,
  `event_type` varchar(50) NOT NULL,
  `details` text DEFAULT NULL,
  `logged_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `session_id` (`session_id`),
  CONSTRAINT `security_logs_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `quiz_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=117 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `security_logs`
--

LOCK TABLES `security_logs` WRITE;
/*!40000 ALTER TABLE `security_logs` DISABLE KEYS */;
INSERT INTO `security_logs` VALUES (1,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 09:49:24'),(2,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 09:49:26'),(3,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 09:50:01'),(4,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 09:50:02'),(5,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 09:54:44'),(6,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 09:54:45'),(7,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 09:55:04'),(8,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 09:55:25'),(9,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 09:55:51'),(10,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 09:55:52'),(11,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 09:57:06'),(12,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 09:57:08'),(13,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 09:57:48'),(14,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 09:59:40'),(15,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:00:23'),(16,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:00:24'),(17,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:00:32'),(18,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:00:41'),(19,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:00:41'),(20,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:01:26'),(21,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:01:27'),(22,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:02:18'),(23,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:02:51'),(24,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:02:51'),(25,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:03:11'),(26,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:03:22'),(27,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:03:25'),(28,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:04:55'),(29,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:04:56'),(30,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:05:39'),(31,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:05:39'),(32,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:06:15'),(33,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:06:37'),(34,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:06:37'),(35,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:07:02'),(36,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:12:02'),(37,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:12:15'),(38,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:12:27'),(39,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:14:18'),(40,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:14:19'),(41,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:14:23'),(42,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:15:00'),(43,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:15:12'),(44,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:15:36'),(45,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:15:49'),(46,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:15:49'),(47,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:15:57'),(48,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:16:12'),(49,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:16:18'),(50,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:16:25'),(51,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:16:55'),(52,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:17:02'),(53,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:18:10'),(54,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:18:18'),(55,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:19:42'),(56,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:19:51'),(57,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:20:18'),(58,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:20:18'),(59,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:20:23'),(60,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:20:41'),(61,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:20:47'),(62,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:21:33'),(63,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:21:43'),(64,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:22:13'),(65,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:22:13'),(66,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:22:40'),(67,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:22:47'),(68,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:23:30'),(69,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:23:30'),(70,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:24:16'),(71,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:26:04'),(72,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:26:30'),(73,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:26:45'),(74,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:27:13'),(75,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:27:26'),(76,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:28:03'),(77,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:28:03'),(78,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:28:58'),(79,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:29:44'),(80,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:29:44'),(81,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:30:17'),(82,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:30:19'),(83,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:30:54'),(84,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:31:26'),(85,4,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:32:09'),(86,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:32:12'),(87,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:32:12'),(88,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:32:56'),(89,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:33:50'),(90,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:34:09'),(91,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:34:23'),(92,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:34:23'),(93,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:34:37'),(94,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:34:54'),(95,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:35:23'),(96,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:37:02'),(97,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:37:07'),(98,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:37:44'),(99,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:38:00'),(100,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:38:43'),(101,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:38:43'),(102,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:39:54'),(103,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:40:14'),(104,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:40:17'),(105,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:41:02'),(106,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:42:20'),(107,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:42:37'),(108,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:42:37'),(109,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:55:54'),(110,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:57:29'),(111,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:57:31'),(112,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:57:38'),(113,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 10:57:38'),(114,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 11:07:20'),(115,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 11:22:12'),(116,10,'TAB_SWITCH','User switched tabs or minimized browser.','2026-05-12 11:23:32');
/*!40000 ALTER TABLE `security_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `roll_no` varchar(20) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `quiz_labs` tinyint(4) NOT NULL DEFAULT 8,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `roll_no` (`roll_no`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (1,'26SP-007-SE','Anousha Salman',NULL,8,'2026-05-12 00:38:15'),(2,'26SP-016-SE','Bareera Khan',NULL,8,'2026-05-12 00:38:15'),(3,'26SP-020-SE','Muhammad Sadiq',NULL,9,'2026-05-12 00:38:15'),(4,'26SP-023-SE','Syeda Samana Batool Alvi',NULL,9,'2026-05-12 00:38:15'),(5,'test','Test User',NULL,8,'2026-05-12 03:42:37');
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `system_settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES ('results_published','false');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `test_cases`
--

DROP TABLE IF EXISTS `test_cases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `test_cases` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `challenge_code` varchar(20) NOT NULL,
  `case_number` tinyint(4) NOT NULL,
  `stdin_input` text NOT NULL,
  `expected_output` text NOT NULL,
  `is_sample` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cc_case` (`challenge_code`,`case_number`),
  CONSTRAINT `test_cases_ibfk_1` FOREIGN KEY (`challenge_code`) REFERENCES `coding_challenges` (`challenge_code`)
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_cases`
--

LOCK TABLES `test_cases` WRITE;
/*!40000 ALTER TABLE `test_cases` DISABLE KEYS */;
INSERT INTO `test_cases` VALUES (47,'V007_P1',1,'4\n1 5 3 2','5',0),(48,'V007_P1',2,'3\\n10 20 5','20',0),(49,'V007_P2',1,'5','78.50',0),(50,'V007_P3',1,'test\ntest','Same',0),(51,'V007_P4',1,'3','  *\n **\n***',0),(52,'V007_P5',1,'7','Prime',0),(53,'V007_P5',2,'10','Not Prime',0),(54,'V016_P1',1,'3','  *\n **\n***',0),(55,'V016_P2',1,'5','78.50',0),(56,'V016_P3',1,'3\n1 2 3','6',0),(57,'V016_P4',1,'test\ntest','Same',0),(58,'V016_P5',1,'7','Prime',0),(59,'V016_P5',2,'10','Not Prime',0),(60,'V020_P1',1,'3','  *\n **\n***',0),(61,'V020_P2',1,'3','Sq: 9, Cu: 27',0),(62,'V020_P3',1,'2 3','8',0),(63,'V020_P3',2,'3 2','9',0),(64,'V020_P4',1,'2','2\n4\n6\n8\n10',0),(65,'V020_P5',1,'4\n1 5 3 2','5',0),(66,'V020_P5',2,'3\\n10 20 5','20',0),(67,'V023_P1',1,'16','4.00',0),(68,'V023_P2',1,'4','Even: 6, Odd: 4',0),(69,'V023_P3',1,'3','  *\n **\n***',0),(70,'V023_P4',1,'121','Yes',0),(71,'V023_P4',2,'123','No',0),(72,'V023_P5',1,'3','Sq: 9, Cu: 27',0),(73,'V_TEST_P1',1,'hello','2',0),(74,'V_TEST_P2',1,'test\ntest','Same',0),(75,'V_TEST_P3',1,'3\n1 2 3','6',0),(76,'V_TEST_P4',1,'1234','4321',0),(77,'V_TEST_P5',1,'4\n1 5 3 2','5',0),(78,'V_TEST_P5',2,'3\\n10 20 5','20',0);
/*!40000 ALTER TABLE `test_cases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary table structure for view `v_coding_leaderboard`
--

DROP TABLE IF EXISTS `v_coding_leaderboard`;
/*!50001 DROP VIEW IF EXISTS `v_coding_leaderboard`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `v_coding_leaderboard` AS SELECT
 1 AS `session_id`,
  1 AS `challenge_code`,
  1 AS `title`,
  1 AS `roll_no`,
  1 AS `full_name`,
  1 AS `verdict`,
  1 AS `cases_passed`,
  1 AS `total_cases`,
  1 AS `submitted_at` */;
SET character_set_client = @saved_cs_client;

--
-- Temporary table structure for view `v_question_stats`
--

DROP TABLE IF EXISTS `v_question_stats`;
/*!50001 DROP VIEW IF EXISTS `v_question_stats`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `v_question_stats` AS SELECT
 1 AS `version_code`,
  1 AS `q_number`,
  1 AS `topic`,
  1 AS `question_text`,
  1 AS `attempts`,
  1 AS `correct`,
  1 AS `pct_correct` */;
SET character_set_client = @saved_cs_client;

--
-- Temporary table structure for view `v_session_results`
--

DROP TABLE IF EXISTS `v_session_results`;
/*!50001 DROP VIEW IF EXISTS `v_session_results`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `v_session_results` AS SELECT
 1 AS `session_id`,
  1 AS `roll_no`,
  1 AS `full_name`,
  1 AS `version_code`,
  1 AS `started_at`,
  1 AS `submitted_at`,
  1 AS `status`,
  1 AS `mcq_score`,
  1 AS `total_mcq`,
  1 AS `mcq_pct`,
  1 AS `coding_attempts`,
  1 AS `coding_accepted` */;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `v_coding_leaderboard`
--

/*!50001 DROP VIEW IF EXISTS `v_coding_leaderboard`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_coding_leaderboard` AS select `cs`.`session_id` AS `session_id`,`cs`.`challenge_code` AS `challenge_code`,`cc`.`title` AS `title`,`qs`.`roll_no` AS `roll_no`,`s`.`full_name` AS `full_name`,`cs`.`verdict` AS `verdict`,`cs`.`cases_passed` AS `cases_passed`,`cs`.`total_cases` AS `total_cases`,`cs`.`submitted_at` AS `submitted_at` from (((`code_submissions` `cs` join `quiz_sessions` `qs` on(`qs`.`id` = `cs`.`session_id`)) join `students` `s` on(`s`.`roll_no` = `qs`.`roll_no`)) join `coding_challenges` `cc` on(`cc`.`challenge_code` = `cs`.`challenge_code`)) order by `cs`.`challenge_code`,`cs`.`cases_passed` desc,`cs`.`submitted_at` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_question_stats`
--

/*!50001 DROP VIEW IF EXISTS `v_question_stats`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_question_stats` AS select `mq`.`version_code` AS `version_code`,`mq`.`q_number` AS `q_number`,`mq`.`topic` AS `topic`,`mq`.`question_text` AS `question_text`,count(`ma`.`id`) AS `attempts`,sum(`ma`.`is_correct`) AS `correct`,round(sum(`ma`.`is_correct`) / count(`ma`.`id`) * 100,1) AS `pct_correct` from (`mcq_questions` `mq` left join `mcq_answers` `ma` on(`ma`.`question_id` = `mq`.`id`)) group by `mq`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_session_results`
--

/*!50001 DROP VIEW IF EXISTS `v_session_results`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_session_results` AS select `qs`.`id` AS `session_id`,`qs`.`roll_no` AS `roll_no`,`s`.`full_name` AS `full_name`,`qs`.`version_code` AS `version_code`,`qs`.`started_at` AS `started_at`,`qs`.`submitted_at` AS `submitted_at`,`qs`.`status` AS `status`,`qs`.`mcq_score` AS `mcq_score`,`qs`.`total_mcq` AS `total_mcq`,round(`qs`.`mcq_score` / `qs`.`total_mcq` * 100,1) AS `mcq_pct`,count(`cs`.`id`) AS `coding_attempts`,sum(`cs`.`verdict` = 'ACCEPTED') AS `coding_accepted` from ((`quiz_sessions` `qs` join `students` `s` on(`s`.`roll_no` = `qs`.`roll_no`)) left join `code_submissions` `cs` on(`cs`.`session_id` = `qs`.`id`)) group by `qs`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-12 11:25:57
